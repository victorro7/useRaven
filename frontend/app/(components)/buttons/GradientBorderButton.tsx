// app/(components)/GradientBorderButton.tsx
import React from 'react';

interface GradientBorderButtonProps {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean; // Add disabled prop
}

const GradientBorderButton: React.FC<GradientBorderButtonProps> = ({
  children,
  onClick,
  className = '',
  disabled = false, // Default to not disabled
}) => {
  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) { // Only change background if not disabled
      e.currentTarget.style.background = 'linear-gradient(to right, #5bd1cb, #f050f0)';
      const innerContent = e.currentTarget.querySelector('.inner-content') as HTMLElement | null;
      if (innerContent) {
        innerContent.style.backgroundColor = '#09090b';
      }
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) { // Only change background if not disabled
      e.currentTarget.style.background = 'linear-gradient(to right, #5b5bd1cb, #fc5efc)';
      const innerContent = e.currentTarget.querySelector('.inner-content') as HTMLElement | null;
      if (innerContent) {
        innerContent.style.backgroundColor = '#09090b';
      }
    }
  };

  return (
    <button
      type="button"
      className={`flex items-center justify-center p-0.5 rounded-lg shrink-0 text-white transition-colors duration-300 ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} // Add disabled styles
      onClick={disabled ? undefined : onClick} // Disable onClick if disabled
      style={{
        background: 'linear-gradient(to right, #5b5bd1cb, #fc5efc)',
        border: 'none',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled} // Set the disabled attribute
    >
      <div className="inner-content flex items-center justify-center w-full h-full bg-[#09090b] rounded-lg p-2 transition-colors duration-300">
        {children}
      </div>
    </button>
  );
};

export default GradientBorderButton;
