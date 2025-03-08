// app/(components)/useChat/ChatMessage.tsx
"use client";
import React from 'react';
import Image from 'next/image';
import Markdown from 'markdown-to-jsx';
import LogoIcon from '../icons/LogoIcon';
import { TextGenerateEffect } from './useTypewriter';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document' | 'other' | 'text';
  isTyping?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, mediaUrl, mediaType, isTyping = false }) => {
  const isUser = role === 'user';
  if (role === 'system' || role === 'data') {
    return null;
  }

  const messageClass = isUser
    ? 'bg-[#5b5bd1cb] text-white self-end  px-3 py-2 rounded-xl geist-mono'
    : 'text-white self-start';

  return (
      <div
        className={`flex my-3 w-full ${
          isUser ? 'justify-end' : 'justify-start'
        }`}
      >
          {/*  Conditional Rendering for Logo */}
          {!isUser && (
              <div className="mr-2">
              <LogoIcon />  {/*  Render Logo for assistant messages */}
              </div>
          )}
          <div className={`flex flex-col  ${ isUser ? 'items-end' : 'items-start'}`}>
            <div className={`p-2  max-w-prose ${messageClass} overflow-x-hidden mt-2`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word', scrollbarGutter: 'stable'}}>
                  {/* WebKit-specific scrollbar hiding */}
                  <style jsx>{`
                      .hide-scrollbar::-webkit-scrollbar {
                      width: 0px; /* Hide scrollbar in WebKit browsers */
                      }
                  `}</style>
                  {mediaType === 'image' && mediaUrl && (
                  <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', maxWidth: '300px' }}>
                      <Image
                      src={mediaUrl}
                      alt="Uploaded Image"
                      fill
                      sizes="100%"
                      style={{ objectFit: 'contain', borderRadius: '8px' }}
                      unoptimized={true}
                      />
                  </div>
                  )}
                  {/* Use TypewriterEffectSmooth for assistant messages */}
                  {isTyping && !isUser ? (
                    <TextGenerateEffect filter={false} words={content} duration={0.5}/>
                  ) : (
                    <Markdown
                      options={{
                        overrides: {
                          h1: { props: { className: 'text-2xl font-bold mb-2 whitespace-pre-wrap' } },
                          h2: { props: { className: 'text-xl font-semibold mb-2 whitespace-pre-wrap' } },
                          h3: { props: { className: 'text-lg font-medium mb-2' } },
                          p: { props: { className: 'mb-2 whitespace-pre-wrap' } },
                          li: { props: { className: 'mb-1' } },
                          pre: { props: { className: 'mb-5 bg-gray-800 rounded-md p-2 overflow-x-auto text-sm whitespace-pre-wrap hide-scrollbar', style: { wordBreak: 'break-all' } } },
                          code: { props: { className: 'mb-2 bg-gray-800 text-green-400 rounded px-1 py-0.5 font-mono text-sm', style: { wordBreak: 'break-all' } } },
                        },
                      }}
                    >
                      {content}
                    </Markdown>
                  )}

              </div>
          </div>
      </div>
    );
};

export default ChatMessage;
