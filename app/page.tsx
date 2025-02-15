// app/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import Navbar from './(components)/Navbar';
import ChatInput from './(components)/ChatInput';
import ChatMessage from './(components)/ChatMessage';
import SuggestionChip from './(components)/SuggestionChip';
import LogoIcon from './(components)/LogoIcon';

export default function Home() {
  const { messages, input, setInput, handleInputChange, handleSubmit, isLoading, error, reload } = useChat({
    api: '/api/chat',
    // onFinish: (message) => {
    //     console.log("Finished Message (Client Side):", message);
    // }
  });

  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!hasInteracted) { // Only affect suggestions if no interaction yet
      setShowSuggestions(input.length === 0);
    }
  }, [input, hasInteracted]); // Add hasInteracted to dependency array

  const handleFormSubmit = useCallback(
    (event: React.FormEvent, data?: { imageUrl?: string; imageFiles?: File[] }) => {
      handleSubmit(event, {
        body: {
          imageUrl: data?.imageUrl,
          imageFiles: data?.imageFiles,
        },
      });

      if (!hasInteracted) { // First interaction
        setShowTitle(false);
        setShowSuggestions(false);
        setHasInteracted(true); // Set interaction flag
      }
    },
    [handleSubmit, messages, input, hasInteracted]
  );

  // Helper function to set the input value 
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

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-black">
      <div className='sticky top-0'><Navbar title="Raven" /></div>
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
                key={message.id}
                role={message.role}
                // .find(p => p.type == "text")?.text || ''
                content={message.parts.find(p => p.type == "text")?.text || ''}
                imageUrl={message.role === 'user' ? message.content.match(/(https?:\/\/[^\s]+)/)?.[0] : undefined}
              />
            ))}
          
            {isLoading && <div className="text-gray-500">Loading...</div>}
            {error && (
              <div className="text-red-500">
                An error occurred. <button onClick={() => reload()}>Retry</button>
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
          <ChatInput value={input} onChange={handleInputChange} onSubmit={handleFormSubmit} />
        </div>
      </div>
    </div>
  );
}