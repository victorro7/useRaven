// app/raven/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import Navbar from '../(components)/Navbar';
import ChatInput from '../(components)/ChatInput';
import ChatMessage from '../(components)/ChatMessage';
import SuggestionChip from '../(components)/SuggestionChip';
import LogoIcon from '../(components)/icons/LogoIcon';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Spinner from '../(components)/icons/Spinner';
import { useChatLogic } from '../(components)/useChatLogic';
import { ChatSidebar } from '../(components)/ChatSidebar';

export default function Home() {
    const { messages, input, setInput, isLoading, error, handleFormSubmit, loadChat, createNewChat, chats, setChats } = useChatLogic();

    const [showSuggestions, setShowSuggestions] = useState(true);
    const [showTitle, setShowTitle] = useState(true);
    const [hasInteracted, setHasInteracted] = useState(false);
    const { user, isLoaded, isSignedIn } = useUser();
    const router = useRouter();

    // Fetch chats on component mount (or user login)
    useEffect(() => {
      const fetchChats = async () => {
        if (isSignedIn) { // Fetch chats only if signed in
          //TODO: Implement fetch chats
          // Example:
          // const response = await fetch('/api/chats'); // Your API endpoint
          // if (response.ok) {
          //   const data = await response.json();
          //   setChats(data); // Assuming your API returns an array of chats
          // }
        }
      };

      fetchChats();
    }, [isSignedIn, setChats])

    useEffect(() => {
        if (!hasInteracted) {
            setShowSuggestions(input.length === 0);
        } else {
            setShowSuggestions(false)
        }

    }, [hasInteracted, input])

    const setPrompt = (prompt: string) => {
        setInput(prompt);
        setShowSuggestions(false);
    };

    const suggestions = [
      { icon: <LogoIcon />, title: "Explain something", content: "Understand a topic.", prompt: "Explain [topic] to me." },
      { icon: <LogoIcon />, title: "Write Code", content: "Get help writing code.", prompt: "Write a [language] function to [do something]." },
      { icon: <LogoIcon />, title: "Summarize Text", content: "Condense text into a summary.", prompt: "Summarize this text: [text]." },
      { icon: <LogoIcon />, title: "Plan something", content: "Plan a trip, a party, etc.", prompt: "Help me to plan [event]." },
    ];

    useEffect(() => {
      if (isLoaded && !isSignedIn) {
        router.push("/sign-in");
      }
    }, [isLoaded, isSignedIn, router]);

    useEffect(() => {
        if(isLoading) {
            setShowTitle(false)
        }
    }, [isLoading])

    useEffect(() => {
    if (!isLoading && hasInteracted) {
      setShowSuggestions(false);
      setShowTitle(false);
    }
  }, [isLoading, hasInteracted]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" color="white" />
      </div>
    );
  }

  const userName = user?.firstName || 'User';

  return (
    <div className="flex h-screen bg-[#09090b] text-black"> {/* Outer flex row, min-h-screen */}
      {/* SideBar */}
      <ChatSidebar chats={chats} loadChat={loadChat} createNewChat={createNewChat} />
      {/* SideBar */}

      {/* Main Content */}
      <div className='flex-grow flex flex-col'>
        <Navbar title="Raven" />

          <main className="flex-grow overflow-y-auto p-2 sm:p-4 relative">
              {/* Intro */}
              {showTitle && (
                <div className="w-full flex justify-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <h2 className="text-2xl sm:text-4xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#6ee1fc] to-[#fc5efc]">
                  Hey {userName}! Welcome to Raven
                  </h2>
                </div>
              )}
              {/* Intro */}
              {/* Chat messages */}
              <div className="w-full sm:max-w-2xl mx-auto flex-grow overflow-y-auto">
                <div className="flex-grow overflow-y-auto ">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      role={message.role}
                      content={message.parts.map((p) => p.text).join('')}
                      imageUrl={message.role === 'user' ? message.parts[0]?.text.match(/(https?:\/\/[^\s]+)/)?.[0] : undefined}
                    />
                  ))}
                  {isLoading && <div className="text-gray-500">Loading...</div>}
                  {error && <div className="text-red-500">An error occurred.</div>}
                </div>
              </div>
              {/* Chat messages */}
          </main>

          {/* Suggestions */}
          {(showSuggestions && showTitle) && (
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
          {/* Suggestions */}

          {/* Input */}
          <div className="sticky bottom-0 p-4 shadow-md ">
            <div className="w-full max-w-2xl mx-auto ">
              <ChatInput value={input} onChange={(e) => setInput(e.target.value)} onSubmit={handleFormSubmit} />
            </div>
          </div>
          {/* Input */}
        </div>
      </div>
  );
}