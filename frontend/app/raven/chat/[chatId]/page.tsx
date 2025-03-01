// app/raven/chat/[chatId]/page.tsx
"use client"
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import ChatMessage from '@/app/(components)/useChat/ChatMessage';
import ChatInput from '@/app/(components)/useChat/ChatInput';
import Spinner from '@/app/(components)/icons/Spinner';
import LogoIcon from '@/app/(components)/icons/LogoIcon';
import SuggestionChip from '@/app/(components)/SuggestionChip';
import { useUser } from '@clerk/nextjs';
import { useChats } from '@/app/(components)/useChat/useChats';
import { useChatMessages } from '@/app/(components)/useChat/useChatMessages';
import { useChatState } from '@/app/(components)/useChat/useChatState';

interface ChatPageParams {
  chatId: string;
}

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { user, isSignedIn } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { chats, createNewChat, deleteChat, renameChat, fetchChats } = useChats();
  const { input, setInput, isLoading, isGenerating, error, selectedChatId, setSelectedChatId } = useChatState();
  const { messages, loadChatMessages, submitMessage, isMessagesLoading, messagesError } = useChatMessages();

  const handleFormSubmit = async (event: React.FormEvent, imageFiles: File[]) => {
    event.preventDefault();
    if (!input.trim() && imageFiles.length === 0) return; // Don't submit if both are empty
    setInput('');
    await submitMessage(input, imageFiles); // Pass text and files
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Set selectedChatId when chatId changes
    setSelectedChatId(chatId);
  }, [chatId, setSelectedChatId]);

  useEffect(() => {
    if (selectedChatId) {
      loadChatMessages(selectedChatId);
    }
  }, [selectedChatId, loadChatMessages]);

  // Show title on initial load and new chat
  useEffect(() => {
    setShowTitle(!isLoading && (messages.length === 0));
  }, [isLoading, messages.length]);

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

  if (isLoading || isMessagesLoading) {
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
    <div className="bg-[#09090b] w-full mx-auto flex flex-col h-full">
        {/* Intro */}
        {showTitle && (
            <div className="flex items-center justify-center h-full">
                <h2 className="text-2xl sm:text-4xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#6ee1fc] to-[#fc5efc]">
                    Hey {userName}! Welcome to Raven
                </h2>
            </div>
        )}

        {/* {(error || messagesError) && <p className="text-red-500">Error: {error || messagesError}</p>}
        {!isLoading && !error && messages.length === 0 && (
            <p className="text-gray-400">No messages yet. Start a conversation!</p>
        )} */}
        {/* Scrollable Chat Messages with Height Limit */}
        <div className="w-full sm:max-w-3xl mx-auto flex-grow relative">
            <div className={`flex flex-col absolute top-0 left-0 right-1 bottom-[1rem] overflow-y-auto ${showTitle? 'hidden':''}`}>
              {messages.map((message) => {
              // Find image parts
              const imageUrls = message.parts
                .filter((part) => part.type === 'image')
                .map((part) => part.text);

              // Get the text content (excluding image URLs)
              const textContent = message.parts
                .filter((part) => part.type !== 'image')
                .map((part) => part.text)
                .join('');

                return (
                    <>
                    {imageUrls.map((imageUrl) => (
                        <ChatMessage
                            key={message.id + imageUrl} // Unique key when multiple images
                            role={message.role}
                            content={textContent}
                            imageUrl={imageUrl}
                        />
                    ))}
                    {/*For messages that do not contain images*/}
                    {imageUrls.length === 0 &&
                        <ChatMessage
                        key={message.id}
                        role={message.role}
                        content={textContent}
                        imageUrl={undefined}
                        />
                    }
                    </>
                )
            })}
            </div>
        </div>
        {isGenerating && <p className="text-gray-400">Generating...</p>}
        {/* Suggestions and Input at the bottom */}
        <div className="p-4  w-full bg-[#09090b]">
            {/* Suggestions */}
            {(showSuggestions && showTitle) && (
                <div className="mb-4">
                    <div className="flex justify-center">
                        <div className="flex gap-2 w-fit overflow-x-auto scroll-smooth scrollbar-hide">
                            {suggestions.map((suggestion) => (
                                <SuggestionChip
                                    key={suggestion.title}
                                    icon={suggestion.icon}
                                    title={suggestion.title}
                                    content={suggestion.content}
                                    onClick={() => setInput(suggestion.prompt || '')}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {/* Suggestions */}
            {/* Input */}
            <div className="w-full max-w-2xl mx-auto">
                <ChatInput value={input} onChange={(e) => setInput(e.target.value)} onSubmit={handleFormSubmit} messages={messages}/>
            </div>
            {/* Input */}
        </div>
    </div>
);
}