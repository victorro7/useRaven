// app/(components)/useChatLogic.ts
import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

interface ChatMessagePart {
  text: string;
}

export interface FormattedChatMessage {
  role: "user" | "data" | "assistant" | "system";
  parts: ChatMessagePart[];
  id: string;
}

const generateId = (type: "user" | "assistant" | "message") => `${type}-${Date.now()}`;

export const useChatLogic = () => {
  const [messages, setMessages] = useState<FormattedChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamedMessageId, setStreamedMessageId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<any[]>([]); //keep
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const { getToken } = useAuth();

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

    // Add new message to the BEGINNING of the messages array:
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInput('');

    // Create a *new* AbortController for this request
    const newAbortController = new AbortController();
    setAbortController(newAbortController); // Store for later

    try {
        const token = await getToken({ template: "kvbackend" });
        if(!token) {
            throw new Error("Authentication token not available.");
        }
        // Send the selectedChatId in the request body
        const requestBody = {
            messages: [...messages, newUserMessage].map(msg => ({
                role: msg.role,
                parts: msg.parts.map(part => part.text)
            })),
            chatId: selectedChatId, // Send chatId separately
        };
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
        signal: newAbortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || response.statusText);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body from server.");
      }

      const newAssistantMessageId = generateId("assistant");
      setStreamedMessageId(newAssistantMessageId);

      
      let partialResponse = "";
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        if (newAbortController.signal.aborted) {
            break; // Exit if aborted
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
                if (parseError instanceof DOMException && parseError.name === 'AbortError') {
                    return; // Expected
                }
                console.error("Error parsing JSON:", parseError, line);
                setError("Error processing response from server.");
            }
          }
        }
      }
    } catch (err: any) {
        if (err instanceof DOMException && err.name === 'AbortError') {
            console.log("Fetch aborted"); // Expected
        } else {
            setError(err.message || "An unexpected error occurred.");
        }
    } finally {
      setIsLoading(false);
      setStreamedMessageId(null);
      setAbortController(null); // Reset the controller

    }
  }, [messages, input, abortController, selectedChatId, getToken]); // Correct dependencies


    const createNewChat = useCallback(async () => {
        if (abortController) {
            abortController.abort();
        }
        setSelectedChatId(null);
        setMessages([]); // Clear messages
        setInput('');
        setAbortController(null);

        try {
            const token = await getToken({ template: "kvbackend" });
            if (!token) {
                throw new Error("Authentication token not available.");
            }
            const response = await fetch('http://localhost:8000/api/chats/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    user_id: "PLACEHOLDER", // Remove this
                    title: null, // Or a default title
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || response.statusText);
            }

            const data: { chat_id: string } = await response.json();
            setSelectedChatId(data.chat_id); // Set chat ID after successful creation
            setAbortController(null);

        } catch (error: any) {
            setError(error.message);
        }
    }, [getToken, setSelectedChatId, setMessages, setInput, abortController]);

    const loadChat = useCallback(async (chatId: string) => {
    if (abortController) {
        abortController.abort(); // Cancel any ongoing requests
    }

    setSelectedChatId(chatId); // Set the selected chat ID *first*
    setMessages([]); // Clear existing messages *before* fetching new ones

    try {
        const token = await getToken({ template: "kvbackend" });
        if (!token) {
            throw new Error('Authentication token not available.');
        }
        const response = await fetch(`http://localhost:8000/api/chats/${chatId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || response.statusText);
        }

        const data = await response.json();
        // Convert timestamps and set messages
        const formattedMessages = data.map((message: any) => ({
            ...message,
            timestamp: new Date(message.timestamp * 1000),
            parts: [{ text: message.content }],
        }));
        setMessages(formattedMessages); // Set messages for the selected chat

    } catch (error: any) {
        setError(error.message);
    } finally {
        setAbortController(null); // Reset abort controller
    }
    }, [getToken, setSelectedChatId, setMessages, abortController]);


    const fetchChats = useCallback(async () => {
    try {
        const token = await getToken({ template: "kvbackend" }); // Get token
        if(!token) {
            throw new Error("Not authenticated")
        }
        const response = await fetch('http://localhost:8000/api/chats', { //CORRECT URL
          headers: {
            'Authorization': `Bearer ${token}`, // Include the token
          }
        });
        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || response.statusText);
        }
        const data = await response.json();
        setChats(data); // Update the chats state
    } catch (error: any) {
        console.error("Error fetching chats:", error);
        setError("Failed to load chats."); // Set a user-friendly error
    }
    }, [setChats, getToken])

    // Add deleteChat function
    const deleteChat = useCallback(async (chatId: string) => {
        if (abortController) {
            abortController.abort();
        }
        try {
            const token = await getToken({ template: 'kvbackend' });
            if (!token) {
                throw new Error('Authentication token not available');
            }

            const response = await fetch(`http://localhost:8000/api/chats/${chatId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || response.statusText);
            }

            // Update the chats state to remove the deleted chat
            setChats(prevChats => prevChats.filter(chat => chat.chatId !== chatId));
            // If the deleted chat is currently selected, clear the selected chat
            if (selectedChatId === chatId) {
                setSelectedChatId(null);
                setMessages([]); // Clear messages if the current chat is deleted
            }

        } catch (error: any) {
            setError(error.message || 'Failed to delete chat.');
        } finally {
            setAbortController(null);
        }
    }, [abortController, getToken, setChats, selectedChatId, setSelectedChatId, setMessages]); // Add dependencies

    const renameChat = useCallback(async (chatId: string, newTitle: string) => {
        console.log("renameChat called with chatId:", chatId, "newTitle:", newTitle); // ADD THIS
        try {
            const token = await getToken({ template: "kvbackend" });
            if (!token) {
                throw new Error("Authentication token not available.");
            }
            const response = await fetch(`http://localhost:8000/api/chats/${chatId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ title: newTitle }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || response.statusText);
            }
            console.log("Rename successful, updating chats state"); // ADD THIS

            setChats(prevChats =>
                prevChats.map(chat =>
                    chat.chatId === chatId ? { ...chat, title: newTitle } : chat
                )
            );

        } catch (error: any) {
            console.error("Error renaming chat:", error); // ADD THIS
            setError(error.message || 'Failed to rename chat.');
        }
    }, [getToken, setChats]);

    return { messages, input, setInput, isLoading, error, handleFormSubmit, setMessages, loadChat, createNewChat, chats, setChats, fetchChats, renameChat, deleteChat };
};