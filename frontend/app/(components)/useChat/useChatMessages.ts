// app/(components)/useChatMessages.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useApiRequest } from './useApiRequest';
import { FormattedChatMessage, generateId } from './constants';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useChatState } from './useChatState';

export const useChatMessages = () => {
    const { makeRequest, loading: isMessagesLoading, error: messagesError, abortController } = useApiRequest();
    const [messages, setMessages] = useState<FormattedChatMessage[]>([]);
    const { selectedChatId, setInput, setSelectedChatId } = useChatState();
    const router = useRouter();
    const isMounted = useRef(true);
    const { getToken } = useAuth();

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        }
    }, []);

    const loadChatMessages = useCallback(async (chatId: string) => {
        setMessages([]);
        const data = await makeRequest<any[]>({ method: 'GET', path: `/api/chats/${chatId}` });
        if (data) {
            const formattedMessages: FormattedChatMessage[] = data.map((message: any) => ({
            role: message.role,
            parts: [{ text: message.content.replace(/\\n/g, '\n') }],
            id: message.messageId,
            }));
            if(isMounted.current) { // Check if mounted before setting state
                setMessages(formattedMessages);
            }
        } else {
            if (isMounted.current) {
            router.push('/raven');
            }
        }
    }, [makeRequest, router, setMessages]);

    const submitMessage = useCallback(async (input: string) => {
        const newUserMessage: FormattedChatMessage = {
            role: 'user',
            parts: [{ text: input }],
            id: generateId('user'),
        };

        setMessages((prevMessages) => [...prevMessages, newUserMessage]);
        const newAssistantMessageId = generateId('assistant');
        setMessages((prevMessages) => [
            ...prevMessages,
            {
            role: 'assistant',
            parts: [{ text: '' }],
            id: newAssistantMessageId,
            },
        ]);

        // Ensure selectedChatId is available *before* making the request.
        if (!selectedChatId) {
            console.error("Cannot submit message: selectedChatId is null.");
            return; // Prevent the API call if no chat is selected
        }

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