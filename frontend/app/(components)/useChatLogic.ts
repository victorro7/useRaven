// app/(components)/useChatLogic.ts
import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs'; // Import useAuth

interface ChatMessagePart {
  text: string;
}

export interface FormattedChatMessage {
  role: "user" | "data" | "assistant" | "system"; // Keep all roles
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
  const [chats, setChats] = useState<any[]>([]);  // Keep this for the chat list
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const { userId, sessionId, getToken } = useAuth(); // Get the getToken function from Clerk

  const handleFormSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    setIsLoading(true);
    setError(null);

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

    const newAbortController = new AbortController();
    setAbortController(newAbortController);

    try {
      const token = await getToken({ template: 'kvbackend' }); //  Get the token
      console.log(token);
      console.log(sessionId)
      console.log(userId)
      if (!token) {
        throw new Error("Authentication token not available."); // Handle missing token
      }

      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the token
        },
        body: JSON.stringify({
          messages: messages.map(msg => ({ role: msg.role, parts: msg.parts.map(part => part.text) })).concat({ role: 'user', parts: [input, `-${selectedChatId}`] }), // Include selectedChatId
        }),
        signal: newAbortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || response.statusText); //  Handle backend errors
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
                throw new Error(jsonChunk.error);  // Handle errors from the stream
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
                    return; // Expected, do nothing
                }
                console.error("Error parsing JSON:", parseError, line);
                setError("Error processing response from server."); // Set a user-friendly error
            }
          }
        }
      }
    } catch (err: any) {
        if (err instanceof DOMException && err.name === 'AbortError') {
            console.log("Fetch aborted"); // Expected, do nothing.
        } else {
            setError(err.message || "An unexpected error occurred."); // Set error message
        }
    } finally {
      setIsLoading(false);
      setStreamedMessageId(null);
      setAbortController(null);
    }
  }, [messages, input, abortController, selectedChatId, getToken]); // Include getToken


  const createNewChat = useCallback(async () => {
    if (abortController) {
      abortController.abort();
    }
    setSelectedChatId(null);
    setMessages([]);
    setInput('');
    setAbortController(null);


    try {
      const token = await getToken(); // Get token
      
      if(!token){
        throw new Error("Not authenticated")
      }
      const response = await fetch('http://localhost:8000/api/chats/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include token
        },
        body: JSON.stringify({
          user_id: "PLACEHOLDER", // This is now handled on the backend.  Remove from here.
          title: null, // Optional title
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || response.statusText);
      }

      const data: { chat_id: string } = await response.json();
      setSelectedChatId(data.chat_id); // Set the selected chat ID

    } catch (error: any) {
      setError(error.message);
    }
  }, [getToken, setSelectedChatId, setMessages, setInput, abortController]); // Include getToken

    const loadChat = useCallback(async (chatId: string) => {
        if (abortController) {
            abortController.abort();
        }
        setSelectedChatId(chatId);
        setMessages([]); // Clear existing messages
        try {
            const token = await getToken(); // <--- Get token
            
            if(!token) {
                throw new Error("Not authenticated.");
            }
            const response = await fetch(`http://localhost:8000/api/chats/${chatId}`,{
              headers: {
                    'Authorization': `Bearer ${token}` // Include the token
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || response.statusText);
            }
            const data = await response.json();

            // Convert timestamps back to Date objects
            const formattedMessages = data.map((message: any) => ({
                ...message,
                timestamp: new Date(message.timestamp * 1000), // Convert to milliseconds from seconds
                parts: [{text: message.content}]
            }));
            setMessages(formattedMessages);
            setAbortController(null);
        } catch (error: any) {
            setError(error.message);
        }
    }, [setSelectedChatId, setMessages, abortController, getToken]);

    const fetchChats = useCallback(async () => {
    try {
        const token = await getToken(); // Get token
        
        if(!token) {
            throw new Error("Not authenticated")
        }
        const response = await fetch('http://localhost:8000/api/chats', {
        headers: {
            'Authorization': `Bearer ${token}`, // Include token
        },
        });
        console.log(Response.json({ token }))
        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || response.statusText);
        }
        const data = await response.json();
        setChats(data);
    } catch (error: any) {
        console.error("Error fetching chats:", error);
        setError("Failed to load chats."); // Set a user-friendly error
    }
    }, [setChats, getToken]); // Include getToken


  return { messages, input, setInput, isLoading, error, handleFormSubmit, setMessages, loadChat, createNewChat, chats, setChats, fetchChats };
};