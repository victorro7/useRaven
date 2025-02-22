// components/MainChatContent.tsx
import React from 'react';
import ChatMessage from './ChatMessage'; // Assuming you have this component
import Spinner from './icons/Spinner'; // Assuming you have this component
import SuggestionChip from './SuggestionChip'; // Assuming you have this component
import ChatInput from './ChatInput'; // Assuming you have this component

interface MainChatContentProps {
  messages: any[]; // Replace 'any[]' with your actual message type
  isLoading: boolean;
  showTitle: boolean;
  userName: string;
  isGenerating: boolean;
  error: Error | null; // Or your specific error type
  suggestions: { title: string; icon: JSX.Element; content: string; prompt: string }[]; // Replace with your suggestion type
  setPrompt: (prompt: string) => void;
  input: string;
  setInput: (input: string) => void;
  handleFormSubmit: (event: React.FormEvent) => void;
  showSuggestions: boolean;
}

const MainChatContent: React.FC<MainChatContentProps> = ({
  messages,
  isLoading,
  showTitle,
  userName,
  isGenerating,
  error,
  suggestions,
  setPrompt,
  input,
  setInput,
  handleFormSubmit,
  showSuggestions,
}) => {
  return (
    <div className='flex-grow flex flex-col'>
      <main className="flex-grow overflow-y-auto p-2 sm:p-4 relative">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <Spinner size="lg" color="white" />
          </div>
        )}
        {/* Loading Spinner */}

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
            {isGenerating && <div className="p-2 text-gray-500">Typing...</div>}
            {error && <div className="text-red-500">An error occurred.</div>}
          </div>
        </div>
        {/* Chat messages */}
      </main>

      {/* Suggestions */}
      {showSuggestions && showTitle && (
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
  );
};

export default MainChatContent;