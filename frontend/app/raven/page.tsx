// app/raven/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../(components)/Navbar';
import ChatInput from '../(components)/ChatInput';
import ChatMessage from '../(components)/ChatMessage';
import SuggestionChip from '../(components)/SuggestionChip';
import LogoIcon from '../(components)/icons/LogoIcon';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Spinner from '../(components)/icons/Spinner';

interface ChatMessagePart {
  text: string;
}

interface FormattedChatMessage {
  role: string;
  parts: ChatMessagePart[];
  id: string; // Add an ID
}

export default function Home() {
  const [messages, setMessages] = useState<FormattedChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
    const [streamedMessageId, setStreamedMessageId] = useState<string | null>(null); // Track the ID of the streaming message


  useEffect(() => {
    if (!hasInteracted) {
      setShowSuggestions(input.length === 0);
    }
  }, [input, hasInteracted]);

const handleFormSubmit = useCallback(async (event: React.FormEvent, data?: { imageUrl?: string; imageFiles?: File[] }) => {
    event.preventDefault();

    setIsLoading(true);
    setError(null);

    const newUserMessage: FormattedChatMessage = {
      role: 'user',
      parts: [{ text: input }],
      id: `user-${Date.now()}`, // Generate a unique ID
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
          messages: messages.map(msg => ({ role: msg.role, parts: msg.parts.map(part => part.text) })).concat({role: 'user', parts: [input]}),
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
      const newAssistantMessageId = `assistant-${Date.now()}`; // Generate unique ID at the *start*
        setStreamedMessageId(newAssistantMessageId); //store current streaming message

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
                    // Update existing message
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
                    // Create new message
                    const newAssistantMessage: FormattedChatMessage = {
                      role: 'assistant',
                      parts: [{ text: jsonChunk.response }],
                      id: newAssistantMessageId, // Use the generated ID
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
      setStreamedMessageId(null); // Reset streamed ID
      if (!hasInteracted) {
        setShowTitle(false);
        setShowSuggestions(false);
        setHasInteracted(true);
      }
    }
  }, [messages, input, hasInteracted]); // Removed streamedMessageId from dependencies


    const setPrompt = (prompt: string) => {
        setInput(prompt);
    };

  const suggestions = [

    {

      icon: <LogoIcon />,

      title: "Explain something",

      content: "Understand a topic.",

      prompt: "Explain [topic] to me."

    },

    {

      icon: <LogoIcon />,

      title: "Write Code",

      content: "Get help writing code.",

      prompt: "Write a [language] function to [do something]."

    },

    {

      icon: <LogoIcon />,

      title: "Summarize Text",

      content: "Condense text into a summary.",

      prompt: "Summarize this text: [text]."

    },

    {

      icon: <LogoIcon />,

      title: "Plan something",

      content: "Plan a trip, a party, etc.",

      prompt: "Help me to plan [event]."

    },

  ];

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" color="white" />
      </div>
    );
  }
  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-black">
      <Navbar title="Raven" />
      {showTitle && (
        <div className="w-full flex justify-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <h2 className="text-4xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#6ee1fc] to-[#fc5efc]">
            Welcome to Raven
          </h2>
        </div>
      )}

      <main className="flex-grow overflow-y-auto p-2 sm:p-4 relative">
        <div className="w-full sm:max-w-2xl mx-auto">
          <div className="flex-grow overflow-y-auto">
           {messages.map((message) => (
              <ChatMessage
                key={message.id} // Use the ID as the key
                role={message.role}
                content={message.parts.map((p) => p.text).join('')}
                imageUrl={
                  message.role === 'user'
                    ? message.parts[0]?.text.match(/(https?:\/\/[^\s]+)/)?.[0]
                    : undefined
                }
              />
            ))}

            {isLoading && <div className="text-gray-500">Loading...</div>}
            {error && (
              <div className="text-red-500">
                An error occurred.
              </div>
            )}
          </div>
        </div>
      </main>

      {showSuggestions && (
        <div className="sticky bottom-16 p-2 w-full max-w-2xl mx-auto">
          <div className="flex justify-center">
            <div className="flex gap-2 w-fit overflow-x-auto scroll-smooth scrollbar-hide">
              {suggestions.map((suggestion) => (
                <SuggestionChip
                  key={suggestion.title}
                  icon={suggestion.icon}
                  title={suggestion.title}
                  content={suggestion.content}
                  onClick={() => setPrompt(suggestion.prompt)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="sticky bottom-0 p-4 shadow-md">
        <div className="w-full max-w-2xl mx-auto ">
          <ChatInput value={input} onChange={(e) => setInput(e.target.value)} onSubmit={handleFormSubmit} />
        </div>
      </div>
    </div>
  );
}