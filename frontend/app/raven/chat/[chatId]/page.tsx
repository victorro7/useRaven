// app/raven/chat/[chatId]/page.tsx
"use client"
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useChatLogic } from '@/app/(components)/useChatLogic';
import ChatMessage from '@/app/(components)/ChatMessage';
import ChatInput from '@/app/(components)/ChatInput';
import Spinner from '@/app/(components)/icons/Spinner';
import LogoIcon from '@/app/(components)/icons/LogoIcon';
import SuggestionChip from '@/app/(components)/SuggestionChip';
import { useUser } from '@clerk/nextjs';

interface ChatPageParams {
  chatId: string;
}

export default function ChatPage() {
  const { messages, input, setInput, handleFormSubmit, isLoading, error, loadChat } = useChatLogic();
  const params = useParams();
  const chatId = params.chatId as string;
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { user } = useUser();


  useEffect(() => {
    if (chatId) {
      loadChat(chatId);
    }
  }, [chatId, loadChat]);

  useEffect(() => {
    if (!hasInteracted) {
        setShowSuggestions(input.length === 0);
    } else {
        setShowSuggestions(false)
    }
  }, [hasInteracted, input]);

  const setPrompt = (prompt: string) => {
      setInput(prompt);
      setShowSuggestions(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner size="lg" color="white" />
      </div>
    )
  }

  const suggestions = [
    { icon: <LogoIcon />, title: "Explain something", content: "Understand a topic.", prompt: "Explain [topic] to me." },
    { icon: <LogoIcon />, title: "Write Code", content: "Get help writing code.", prompt: "Write a [language] function to [do something]." },
    { icon: <LogoIcon />, title: "Summarize Text", content: "Condense text into a summary.", prompt: "Summarize this text: [text]." },
    { icon: <LogoIcon />, title: "Plan something", content: "Plan a trip, a party, etc.", prompt: "Help me to plan [event]." },
  ];

  if (error) {
    return <div className="text-red-500">error: {error}</div>;
  }

  const userName = user?.firstName || '';
  return (
    <div className="w-full sm:max-w-2xl mx-auto flex-grow overflow-y-auto">
        {/* Intro */}
        {/* {showTitle &&  (
          <div className="w-full flex justify-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <h2 className="text-2xl sm:text-4xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#6ee1fc] to-[#fc5efc] ">
            Hey {userName}! Welcome to Raven
            </h2>
          </div>
        )} */}
        {/* Intro */}
        <div className="flex-grow overflow-y-auto">
            {messages.map((message) => (
            <ChatMessage
                key={message.id}
                role={message.role}
                content={message.parts.map((p) => p.text).join('')}
                imageUrl={message.role === 'user' ? message.parts[0]?.text.match(/(https?:\/\/[^\s]+)/)?.[0] : undefined}
            />
            ))}
        </div>
        {/* Suggestions */}
        {(showSuggestions && showTitle) && (
            <div className=" p-2 w-full max-w-2xl mx-auto">
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
        {/* Suggestions */}
        <div className="sticky bottom-0 p-4 shadow-md">
            <div className="w-full max-w-2xl mx-auto ">
                <ChatInput value={input} onChange={(e) => setInput(e.target.value)} onSubmit={handleFormSubmit} />
            </div>
        </div>
    </div>
  );
}