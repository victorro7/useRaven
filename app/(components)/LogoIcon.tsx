import React from 'react';

const Logo: React.FC = () => {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6ee1fc" />
          <stop offset="100%" stopColor="#fc5efc" />
        </linearGradient>
      </defs>
      <path
        stroke="url(#logoGradient)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        fill="none"
      />
    </svg>
  );
};

export default Logo;