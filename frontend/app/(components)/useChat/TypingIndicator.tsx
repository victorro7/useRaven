// app/(components)/useChat/TypingIndicator.tsx
import React from 'react';
import LogoIcon from '../icons/LogoIcon';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center">
        <div className="mr-2">
            <LogoIcon />
        </div>
      <div className="flex items-center justify-start p-2 rounded-xl text-white bg-gray-800">
        <span className="animate-pulse mr-1 w-2 h-2 bg-white rounded-full"></span>
        <span className="animate-pulse mr-1 w-2 h-2 bg-[#5b5bd1cb] rounded-full animation-delay-150"></span>
        <span className="animate-pulse w-2 h-2 bg-[#f050f0] rounded-full animation-delay-300"></span>
      </div>
    </div>
  );
};

export default TypingIndicator;