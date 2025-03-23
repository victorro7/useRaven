// app/(components)/useChat/ChatMessage.tsx
"use client";
import React,  { useState, useRef, useEffect }from 'react';
import Image from 'next/image';
import LogoIcon from '../icons/LogoIcon';
import MiniLucidLogo from '../icons/MiniLucidLogo';

import { TextGenerateEffect } from './useTypewriter';
import { parseContent } from '@/lib/parseContent';
import { FaCopy, FaCheck } from 'react-icons/fa';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document' | 'other' | 'text';
  isTyping?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, mediaUrl, mediaType}) => {
  const isUser = role === 'user';
  const [isHovered, setIsHovered] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const copyToClipboard = async () => {
    if (content) {
      try {
        await navigator.clipboard.writeText(content);
        setIsCopied(true);

        // Reset isCopied after a short delay (for visual feedback)
        setTimeout(() => {
          setIsCopied(false);
        }, 2000); // 2 seconds
          if(copyButtonRef.current){
              copyButtonRef.current.focus();
          }
      } catch (err) {
        console.error('Failed to copy text:', err);
        // Handle errors (e.g., display an error message to the user)
      }
    }
  };

  if (role === 'system' || role === 'data') {
    return null;
  }

  const messageClass = isUser
    ? 'bg-[#5b5bd1cb] text-white self-end  px-3 py-2 rounded-xl geist-mono'
    : 'text-white self-start';

  const parsedContent = parseContent(content);

  

  return (
      <div
      className={`flex my-3 w-full ${isUser ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      >
          {/*  Conditional Rendering for Logo */}
          {!isUser && (
              <div className="mr-2">
                {isMobile ? <LogoIcon /> : <MiniLucidLogo /> }
              </div>
          )}
          <div className={`flex flex-col w-full overflow-x-hidden  ${ isUser ? 'items-end' : 'items-start'} relative`}>
            <div className={
              `p-2  max-w-prose ${messageClass} overflow-x-hidden mt-2
              ${(isHovered ) ? 'border rounded-lg border-white' : ''}`
            }style={{ wordBreak: 'break-word', overflowWrap: 'break-word', scrollbarGutter: 'stable'}}>

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
                  <TextGenerateEffect filter={false}  parsedContent={parsedContent} />
              </div>
          </div>
          {/* Conditional Copy Icon */}
          {(isHovered ) && (
                    <div className=''>
                      <button
                        ref={copyButtonRef}
                        type="button"
                        onClick={copyToClipboard}
                        className="sticky top-0 right-1 text-white rounded-full p-2 sm:text-lg hover:bg-[#5b5bd1cb]"
                        aria-label="Copy message" // ARIA label for accessibility
                      >
                        {isCopied ? <FaCheck /> : <FaCopy />}
                      </button>
                      </div>
                  )}
      </div>
    );
};

export default ChatMessage;
