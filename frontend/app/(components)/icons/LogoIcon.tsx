// app/(components)/icons/LogoIcon.tsx
import React from 'react';

interface LogoIconProps {
  className?: string; // Add className prop
}

const LogoIcon: React.FC<LogoIconProps> = ({ className }) => { // Destructure className
  return (
    <svg
      className={`h-8 w-8 ${className || ''}`} // Apply className, default to empty string if not provided
      viewBox="0 0 24 24"
      fill="none"
      stroke="url(#logoGradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5bd1cb" />
          <stop offset="100%" stopColor="#f050f0" />
        </linearGradient>
      </defs>
      <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  );
};

export default LogoIcon;