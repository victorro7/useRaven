import React from 'react';

interface SuggestionChipProps {
  icon: JSX.Element;
  title: string;
  content: string;
  onClick: () => void;
}

const SuggestionChip: React.FC<SuggestionChipProps> = ({ icon, title, content, onClick }) => {
  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'linear-gradient(to right, #5bd1cb, #f050f0)';

    const innerContent = e.currentTarget.querySelector('.inner-content') as HTMLElement | null; // Cast to HTMLElement or null
    if (innerContent) {
      innerContent.style.backgroundColor = '#1a1a1c';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'linear-gradient(to right, #6ee1fc, #fc5efc)';

    const innerContent = e.currentTarget.querySelector('.inner-content') as HTMLElement | null; // Cast to HTMLElement or null
    if (innerContent) {
      innerContent.style.backgroundColor = '#09090b';
    }
  };

  return (
    <button
      type="button"
      className="flex flex-col items-center justify-center p-2 rounded-lg shrink-0 text-white transition-colors duration-300"
      onClick={onClick}
      style={{
        background: 'linear-gradient(to right, #5b5bd1cb, #fc5efc)',
        padding: '2px',
        border: 'none',
        borderRadius: '8px',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="inner-content flex flex-col items-center justify-center bg-[#09090b] rounded-lg p-2 transition-colors duration-300">
        {icon}
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs mt-1">{content}</span>
      </div>
    </button>
  );
};

export default SuggestionChip;