// app/(components)/useChatLogic.ts
import { useState, useCallback } from 'react';

interface ChatMessagePart {
  text: string;
}

export interface FormattedChatMessage {
  role: "user" | "data" | "assistant" | "system";
  parts: ChatMessagePart[];
  id: string;
}
const generateId = (type: "user" | "assistant") => `${type}-${Date.now()}`;

export const useChatLogic = () => {
  const [messages, setMessages] = useState<FormattedChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamedMessageId, setStreamedMessageId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null); // Store AbortController


  const handleFormSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    setIsLoading(true);
    setError(null);

     // Abort any existing requests
    if (abortController) {
        abortController.abort();
    }

    const newUserMessage: FormattedChatMessage = {
      role: 'user',
      parts: [{ text: input }],
      id: generateId("user"),
    };

    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInput('');

    // Create a *new* AbortController for this request
    const newAbortController = new AbortController();
    setAbortController(newAbortController); // Store for later

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(msg => ({ role: msg.role, parts: msg.parts.map(part => part.text) })).concat({ role: 'user', parts: [input] }),
        }),
        signal: newAbortController.signal, // Pass the signal to fetch
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || response.statusText);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No body in response");
      }

      const newAssistantMessageId = generateId("assistant");
      setStreamedMessageId(newAssistantMessageId);

      let partialResponse = "";
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }
        //check if aborted
        if (newAbortController.signal.aborted) {
            break;
        }

        const chunk = new TextDecoder().decode(value);
        partialResponse += chunk;

        let lines = partialResponse.split('\n');
        partialResponse = lines.pop() || "";

        for (const line of lines) {
          if (line) {
            try {
              const jsonChunk = JSON.parse(line);
              if (jsonChunk.error) {
                throw new Error(jsonChunk.error);
              }

              if (jsonChunk.response) {
                setMessages((prevMessages) => {
                  const existingAssistantMessageIndex = prevMessages.findIndex(
                    (msg) => msg.id === newAssistantMessageId
                  );

                  if (existingAssistantMessageIndex !== -1) {
                    const updatedMessages = [...prevMessages];
                    updatedMessages[existingAssistantMessageIndex] = {
                      ...updatedMessages[existingAssistantMessageIndex],
                      parts: [{ text: updatedMessages[existingAssistantMessageIndex].parts[0].text + jsonChunk.response }],
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
              // Ignore abort errors, handle others
                if (parseError instanceof DOMException && parseError.name === 'AbortError') {
                    return; // Exit the callback if aborted
                }
              console.error("Error parsing JSON:", parseError, line);
            }
          }
        }
      }
    } catch (err: any) {
      // Catch and ignore abort errors at the top level too
        if (err instanceof DOMException && err.name === 'AbortError') {
            console.log("Fetch aborted"); // Log the abort
            return; // Don't set an error
        }
      setError(err.message);
    } finally {
      setIsLoading(false);
      setStreamedMessageId(null);
      setAbortController(null); // Reset the controller

    }
  }, [messages, input, abortController]); // Add abortController to dependencies


  const createNewChat = useCallback(() => {
    //abort any ongoing requests
    if (abortController) {
        abortController.abort();
    }
    setSelectedChatId(null);
    setMessages([]);
    setInput('');
    setAbortController(null); // Reset controller on new chat

  }, [setSelectedChatId, setMessages, setInput, abortController]); // Add to dependencies

    const loadChat = useCallback(async (chatId: string) => {
        setSelectedChatId(chatId);
         //TODO Implement
        // Fetch messages for chatId from backend
        // Update messages state

    }, []);
  return { messages, input, setInput, isLoading, error, handleFormSubmit, setMessages, loadChat, createNewChat, chats, setChats };
};