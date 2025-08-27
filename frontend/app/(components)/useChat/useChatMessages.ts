/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(components)/useChat/useChatMessages.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useApiRequest } from './useApiRequest';
import { FormattedChatMessage, ChatMessagePart, generateId } from './constants';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useChatState } from './useChatState';
import { useMediaUpload } from './useMediaUpload';
import { BASE_URL } from './constants';

export const useChatMessages = () => {
  const { makeRequest, loading: isMessagesLoading, error: messagesError, abortController } = useApiRequest();
  const [messages, setMessages] = useState<FormattedChatMessage[]>([]);
  const { selectedChatId } = useChatState();
  const router = useRouter();
  const isMounted = useRef(true);
  const { getToken } = useAuth();
  const { uploadMedia } = useMediaUpload();

  useEffect(() => {
      isMounted.current = true;
      return () => {
        isMounted.current = false;
      }
  }, []);

  const loadChatMessages = useCallback(async (chatId: string) => {
      setMessages([]);
      console.log(isMessagesLoading);
      const data = await makeRequest<any[]>({ method: 'GET', path: `/api/chats/${chatId}` });
      console.log(isMessagesLoading);
      if (data) {
          const formattedMessages: FormattedChatMessage[] = data.map((message: any) => {
              const parts: ChatMessagePart[] = [];
              if (message.content && message.content.trim() !== "") {
                  parts.push({ text: message.content.replace(/\\n/g, '\n'), type: 'text' });
              }
              // Use media_type to determine the type
              if (message.media_url && message.media_type) {
                  const [mediaCategory] = message.media_type.split('/');
                  parts.push({ type: mediaCategory as ChatMessagePart["type"], text: message.media_url });
              }
              return {
                  role: message.role,
                  parts: parts,
                  id: message.messageId,
              };
          });
          if (isMounted.current) {
              setMessages(formattedMessages);
          }
      } else {
          if (isMounted.current) {
              router.push('/chat');
          }
      }
  }, [router]);

  const submitMessage = useCallback(
      async (text: string, mediaFiles: File[]) => {
        const newUserMessage: FormattedChatMessage = {
          role: 'user',
          parts: [],
          id: generateId('user'),
        };
          const newAssistantMessageId = generateId("assistant");

        if (!selectedChatId) {
          console.error("Cannot submit message: selectedChatId is null.");
          return;
        }

        // 1. Upload ALL media *first* (concurrently)
        let mediaUrls: string[] = [];
        if (mediaFiles.length > 0) {
          try {
            const uploadPromises = mediaFiles.map(file => uploadMedia(file));
            mediaUrls = (await Promise.all(uploadPromises)).filter((url): url is string => url !== null);

            if (mediaUrls.length !== mediaFiles.length) {
              console.error("Some media uploads failed.");
              setMessages(prevMessages => prevMessages.filter(msg => msg.id !== newAssistantMessageId))
              setMessages(prevMessages => prevMessages.filter(msg => msg.id !== newUserMessage.id))
              return;
            }
            // Add all media URLs to the parts array
            mediaUrls.forEach(url => {
              const file = mediaFiles.find(() => uploadPromises.some(promise => promise.then(u => u === url))); // Removed f
              const mimeType = file ? file.type : 'other'; // Fallback to 'other' if not found
              const [mediaCategory] = mimeType.split('/');
              newUserMessage.parts.push({ mimeType: mimeType, type: mediaCategory as ChatMessagePart["type"], text: url }); // Dynamic type
            });
          } catch (error) {
            console.error("Media upload error:", error);
            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== newAssistantMessageId))
            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== newUserMessage.id))
            return;
          }
        }

          // 2. Add text *after* media upload (if any)
          if (text.trim() !== "") {
            newUserMessage.parts.push({ text, type: 'text' });
          }

          // Optimistically add the user message *and* a placeholder for the assistant message
          setMessages((prevMessages) => [...prevMessages, newUserMessage, { role: 'assistant', parts: [{ text: ''}], id: newAssistantMessageId }]);
          // Set typingMessageId to the ID of the new assistant message

        // 3. Construct request body *after* handling media and text
        const requestBody = {
          messages: [...messages, newUserMessage].map((msg) => ({
            role: msg.role,
            parts: msg.parts,
          })),
          chatId: selectedChatId,
        };

      try {
          const token = await getToken({ template: "kvbackend" });
          if(!token) {
              throw new Error("Authentication token not available.");
          }
          const response = await fetch(`${BASE_URL}/chat`, {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify(requestBody),
                  signal: abortController?.signal,
              });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.detail || response.statusText);
          }

          const reader = response.body?.getReader();
          if (!reader) {
              throw new Error('No response body from server.');
          }

          let partialResponse = '';
          while (true) {
              const { done, value } = await reader.read();

              if (done || abortController?.signal.aborted) {
              break;
              }

              const chunk = new TextDecoder().decode(value);
              partialResponse += chunk;

              const lines = partialResponse.split('\n');
              partialResponse = lines.pop() || '';

              for (const line of lines) {
              if (!line) continue;
              try {
                  const jsonChunk = JSON.parse(line);
                  if (jsonChunk.error) {
                  console.error('Server stream error:', jsonChunk.error);
                  break;
                  }

                  if (jsonChunk.response && isMounted.current) {
                  setMessages((prevMessages) => {
                      const existingAssistantMessageIndex = prevMessages.findIndex(
                      (msg) => msg.id === newAssistantMessageId
                      );

                      if (existingAssistantMessageIndex !== -1) {
                      const updatedMessages = [...prevMessages];
                      updatedMessages[existingAssistantMessageIndex] = {
                          ...updatedMessages[existingAssistantMessageIndex],
                          parts: [
                          {
                              text:
                              updatedMessages[existingAssistantMessageIndex].parts[0].text +
                              jsonChunk.response,
                              type: 'text',
                          },
                          ],
                      };
                      // Inside the setMessages callback:
                      // updatedMessages[existingAssistantMessageIndex].parts[0].text += jsonChunk.response; // Append!
                      return updatedMessages;
                      } else {
                      const newAssistantMessage: FormattedChatMessage = {
                          role: 'assistant',
                          parts: [{ text: jsonChunk.response, type: "text" }],
                          id: newAssistantMessageId,
                      };
                      return [...prevMessages, newAssistantMessage];
                      }
                  });
                  }
              } catch (parseError) {
                  if (parseError instanceof DOMException && parseError.name === 'AbortError') {
                  return; // Expected
                  }
                  // Skip non-JSON lines gracefully
                  console.warn('Skipping non-JSON stream line:', line);
                  continue;
              }
              }
          }
          } catch (e: any) {
          console.error('Error during streaming', e);
          }

  }, [messages, abortController, uploadMedia, getToken, selectedChatId]);

  return { messages, setMessages, loadChatMessages, submitMessage, isMessagesLoading, messagesError };
};