// app/(components)/useChatMessages.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useApiRequest } from './useApiRequest';
import { FormattedChatMessage, ChatMessagePart, generateId } from './constants';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useChatState } from './useChatState';
import { useImageUpload } from './useImageUpload';

export const useChatMessages = () => {
    const { makeRequest, loading: isMessagesLoading, error: messagesError, abortController } = useApiRequest();
    const [messages, setMessages] = useState<FormattedChatMessage[]>([]);
    const { selectedChatId, setInput, setSelectedChatId } = useChatState();
    const router = useRouter();
    const isMounted = useRef(true);
    const { getToken } = useAuth();
    const { uploadImage, loading: isUploading, error: uploadError } = useImageUpload();

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        }
    }, []);

    const loadChatMessages = useCallback(async (chatId: string) => {
        setMessages([]);
        const data = await makeRequest<any[]>({ method: 'GET', path: `/api/chats/${chatId}` });
        console.log("Data from backend:", data);
        if (data) {
            const formattedMessages: FormattedChatMessage[] = data.map((message: any) => {
                const parts: ChatMessagePart[] = [];
                if (message.content && message.content.trim() !== "") {
                    parts.push({ text: message.content.replace(/\\n/g, '\n')})
                }
                if(message.media_url && message.media_type === 'image'){
                    parts.push({  type: 'image', text: message.media_url })
                }
                return {
                role: message.role,
                parts: parts, // Use the parts array
                id: message.messageId,
            }});
            console.log("Formatted messages:", formattedMessages);
            if(isMounted.current) { // Check if mounted before setting state
                setMessages(formattedMessages);
            }
        } else {
            if (isMounted.current) {
            router.push('/raven');
            }
        }
    }, [makeRequest, router]);

    const submitMessage = useCallback(
        async (text: string, imageFiles: File[]) => {
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
    
          // 1. Upload ALL images *first* (concurrently)
          let imageUrls: string[] = [];
          if (imageFiles.length > 0) {
            try {
              const uploadPromises = imageFiles.map(file => uploadImage(file));
              imageUrls = (await Promise.all(uploadPromises)).filter((url): url is string => url !== null); //wait for all promises to resolve
    
              if (imageUrls.length !== imageFiles.length) {
                console.error("Some image uploads failed."); // Not all images uploaded
                //remove placeholder:
                setMessages(prevMessages => prevMessages.filter(msg => msg.id !== newAssistantMessageId)) //remove the assistant
                setMessages(prevMessages => prevMessages.filter(msg => msg.id !== newUserMessage.id)) //remove failed message
                return; // Stop processing
              }
              // Add all image URLs to the parts array
              imageUrls.forEach(url => newUserMessage.parts.push({ type: 'image', text: url }));
            } catch (error) {
              console.error("Image upload error:", error);
               //remove placeholder:
              setMessages(prevMessages => prevMessages.filter(msg => msg.id !== newAssistantMessageId)) //remove the assistant
              setMessages(prevMessages => prevMessages.filter(msg => msg.id !== newUserMessage.id)) //remove failed message
              return; // Stop processing
            }
          }
    
            // 2. Add text *after* image upload (if any)
            if (text.trim() !== "") { // Only add if there is text.
                newUserMessage.parts.push({ text });
            }
    
            // Optimistically add the user message *and* a placeholder for the assistant message
            setMessages((prevMessages) => [...prevMessages, newUserMessage, { role: 'assistant', parts: [{ text: '' }], id: newAssistantMessageId }]);
    
          // 3. Construct request body *after* handling images and text
          const requestBody = {
            messages: [...messages, newUserMessage].map((msg) => ({
              role: msg.role,
              parts: msg.parts.map((part) => part.text),
            })),
            chatId: selectedChatId,
          };

        try {
            const token = await getToken({ template: "kvbackend" });
            if(!token) {
                throw new Error("Authentication token not available.");
            }
            const response = await fetch('http://localhost:8000/chat', {
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

                let lines = partialResponse.split('\n');
                partialResponse = lines.pop() || '';

                for (const line of lines) {
                if (!line) continue;

                try {
                    const jsonChunk = JSON.parse(line);
                    if (jsonChunk.error) {
                    throw new Error(jsonChunk.error);
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
                            },
                            ],
                        };
                        return updatedMessages;
                        } else {
                        const newAssistantMessage: FormattedChatMessage = {
                            role: 'assistant',
                            parts: [{ text: jsonChunk.response }],
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
                    console.error('Error parsing JSON:', parseError, line);
                    // setError("Error processing response from server.  Check the server logs."); // More specific error
                    return;
                }
                }
            }
            } catch (e: any) {
            console.error('Error during streaming', e);
            }

    }, [messages, abortController]);

    return { messages, setMessages, loadChatMessages, submitMessage, isMessagesLoading, messagesError };
};