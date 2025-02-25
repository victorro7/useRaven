// app/(components)/ChatMessage.tsx
import React from 'react';
import Image from 'next/image';
import Markdown from 'markdown-to-jsx';
import LogoIcon from '../icons/LogoIcon';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
  imageUrl?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, imageUrl }) => {
  if (role === 'system' || role === 'data') {
    return null; // Or render them appropriately
  }

  const isUser = role === 'user';
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
                <div className={`p-2  max-w-prose ${messageClass}`}>
                    {imageUrl && (
                    <div style={{ position: 'relative', width: '100%', height: 'auto', maxWidth: '300px', maxHeight: '200px' }}>
                        <Image
                        src={imageUrl}
                        alt="Uploaded Image"
                        fill
                        sizes="100%"
                        style={{ objectFit: 'contain', borderRadius: '8px' }}
                        />
                    </div>
                    )}
                <Markdown
                  options={{
                    overrides: {
                      h1: {
                        props: {
                          className: 'text-2xl font-bold mb-2 whitespace-pre-wrap', // Style for h1
                        },
                      },
                      h2: {
                        props: {
                          className: 'text-xl font-semibold mb-2 whitespace-pre-wrap', // Style for h2
                        },
                      },
                      h3: {
                          props: {
                            className: 'text-lg font-medium mb-2', // Style for h2
                          },
                        },
                      p: {
                        props: {
                          className: 'mb-2 whitespace-pre-wrap',
                        },
                      },
                      li: {
                        props: {
                          className: 'mb-1', // Add margin to list items
                        },
                      },
                      pre: {
                        props: {
                          className:
                            'mb-5 bg-gray-800 rounded-md p-2 overflow-x-auto text-sm whitespace-pre-wrap',
                        },
                      },
                      code: {
                        props: {
                          className:
                            'mb-2 bg-gray-800 text-green-400 rounded px-1 py-0.5 font-mono text-sm',
                        },
                      },
                    },
                  }}
                >
                  {content}
                </Markdown>
                </div>
            </div>
        </div>
      );
};

export default ChatMessage;