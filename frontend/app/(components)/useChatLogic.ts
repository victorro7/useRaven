// app/(components)/useChatLogic.ts
import { useState, useCallback } from 'react';

interface ChatMessagePart {
  text: string;
}

export interface FormattedChatMessage { // Export this interface
  role: "user" | "data" | "assistant" | "system";
  parts: ChatMessagePart[];
  id: string;
}
const generateId = (type: "user" | "assistant") => `${type}-${Date.now()}`; //utility

export const useChatLogic = () => {
  const [messages, setMessages] = useState<FormattedChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamedMessageId, setStreamedMessageId] = useState<string | null>(null);

  const handleFormSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    setIsLoading(true);
    setError(null);

    const newUserMessage: FormattedChatMessage = {
      role: 'user',
      parts: [{ text: input }],
      id: generateId("user"),
    };

    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInput('');

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(msg => ({ role: msg.role, parts: msg.parts.map(part => part.text) })).concat({ role: 'user', parts: [input] }),
        }),
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
              console.error("Error parsing JSON:", parseError, line);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setStreamedMessageId(null);
    }
  }, [messages, input]);

    return { messages, input, setInput, isLoading, error, handleFormSubmit, setMessages };
};