// app/(components)/useChat/ChatMessage.tsx
"use client";
import React,  { useEffect, useState, useRef }from 'react';
import Image from 'next/image';
import LogoIcon from '../icons/LogoIcon';
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
  const [isMobile, setIsMobile] = useState(false); // State for mobile detection
  const copyButtonRef = useRef<HTMLButtonElement>(null);

  // Inside ChatMessage.tsx, within the component function:
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleTouchStart = () => {
      setIsMobile(true); // Set isMobile to true on touch
  }

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

  useEffect(() => {
      const checkIfMobile = () => {
          setIsMobile(window.innerWidth <= 768);  // Adjust breakpoint as needed
      };

      checkIfMobile(); // Check on initial load
      window.addEventListener('resize', checkIfMobile); // Check on resize

      return () => {
          window.removeEventListener('resize', checkIfMobile); // Clean up listener
      };
  }, []);

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
      onTouchStart={handleTouchStart}
      >
          {/*  Conditional Rendering for Logo */}
          {!isUser && (
              <div className="mr-2">
              <LogoIcon />  {/*  Render Logo for assistant messages */}
              </div>
          )}
          <div className={`flex flex-col w-full overflow-x-hidden  ${ isUser ? 'items-end' : 'items-start'} relative`}>
            <div className={
              `p-2  max-w-prose ${messageClass} overflow-x-hidden mt-2
              ${(isHovered || isMobile) ? 'border border-white' : ''}`
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
          {(isHovered || isMobile) && (
                    <div className=''>
                      <button
                        ref={copyButtonRef}
                        type="button"
                        onClick={copyToClipboard}
                        className="sticky top-0 right-1 bg-[#5b5bd1cb] text-white rounded-full p-1 text-xs hover:bg-blue-700"
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
