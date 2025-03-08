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
import { useChatMessages } from '@/app/(components)/useChat/useChatMessages';
import { useChatState } from '@/app/(components)/useChat/useChatState';
import Image from 'next/image';
import { FaFileAlt, FaVideo, FaFileAudio } from 'react-icons/fa';

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [hasInteracted] = useState(false);
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { input, setInput, isLoading, isGenerating, error, selectedChatId, setSelectedChatId } = useChatState();
  const { messages, loadChatMessages, submitMessage, isMessagesLoading } = useChatMessages();

  const handleFormSubmit = async (event: React.FormEvent, mediaFiles: File[]) => {
    event.preventDefault();
    if (!input.trim() && mediaFiles.length === 0) return;
    setInput('');
    await submitMessage(input, mediaFiles);
  };

  useEffect(() => {
    if (!isMessagesLoading && messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMessagesLoading]);

  useEffect(() => {
    setSelectedChatId(chatId);
  }, [chatId, setSelectedChatId]);

  useEffect(() => {
    if (selectedChatId) {
      loadChatMessages(selectedChatId);
    }
  }, [selectedChatId, loadChatMessages]);

  useEffect(() => {
    setShowTitle(!isLoading && (messages.length === 0));
  }, [isLoading, messages.length]);

  useEffect(() => {
    if (!hasInteracted) {
      setShowSuggestions(input.length === 0);
    } else {
      setShowSuggestions(false);
    }
  }, [hasInteracted, input]);

  if (isLoading || isMessagesLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner size="lg" color="white" />
      </div>
    );
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

  // Helper function for media icons
  const getMediaIcon = (mediaType: string) => {
      if (mediaType?.startsWith('video')) {
      return <FaVideo size={64} style={{ color: 'white' }}/>;
      } else if (mediaType?.startsWith('audio')) {
      return <FaFileAudio size={64} style={{ color: 'white' }}/>;
      }
      return <FaFileAlt size={64} style={{ color: 'white' }}/>; // Default for documents/other
  };

  return (
    <div className="bg-[#09090b] w-full mx-auto flex flex-col h-full">
      {showTitle && (
        <div className="flex items-center justify-center h-full">
          <h2 className="text-2xl sm:text-4xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#6ee1fc] to-[#fc5efc]">
            Hey {userName}! Welcome to Raven
          </h2>
        </div>
      )}

      <div className="w-full sm:max-w-3xl mx-auto flex-grow relative">
        <div className={`flex flex-col absolute top-0 left-0 right-1 bottom-[1rem] overflow-y-auto ${showTitle ? 'hidden' : ''}`}>
        {messages.map((message) => {
            const mediaParts = message.parts.filter((part) => part.type !== 'text' && part.type !== undefined);
            const textContent = message.parts
              .filter((part) => part.type === 'text')
              .map((part) => part.text)
              .join('');

            message.parts
                .filter((part) => part.type === 'text')
                .map((part) => part.text)
                .join('');
            const isUser = message.role === 'user';
            return (
              <div key={message.id} className="mb-4"> {/* Wrapper div */}
                {/* Media Previews (Above Text) */}
                {mediaParts.length > 0 && (
                    <div className={`flex flex-wrap gap-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {mediaParts.map((mediaPart) => {
                                // Defensive checks: Ensure mediaPart.type and mediaPart.text exist
                                if (!mediaPart.type || !mediaPart.text) {
                                  console.warn("Skipping media part with missing type or text:", mediaPart);
                                  return null; // Skip rendering this part
                                }

                                return (
                                  <div key={mediaPart.text} className="relative">
                                    {mediaPart.type === 'image' ? (
                                      <Image
                                        src={mediaPart.text}
                                        alt="Uploaded Media"
                                        width={128}
                                        height={128}
                                        className="rounded-md object-cover"
                                        unoptimized={true}
                                      />
                                    ) : (
                                        <div className='p-2'>{getMediaIcon(mediaPart.type)}</div>
                                    )}
                                  </div>
                                );
                      })}
                    </div>
                )}

                {/* ChatMessage for Text Content */}
                {textContent.trim() && ( // Only render if there's actual text
                    <ChatMessage
                      key={message.id + '_text'}
                      role={message.role}
                      content={textContent}
                    />
                  )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {isGenerating && <p className="text-gray-400">Generating...</p>}

      <div className="p-4 w-full bg-[#09090b]">
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
        <div className="w-full max-w-2xl mx-auto">
          <ChatInput value={input} onChange={(e) => setInput(e.target.value)} onSubmit={handleFormSubmit} messages={messages} />
        </div>
      </div>
    </div>
  );
}