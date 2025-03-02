// app/(components)/GradientButton.tsx
import React from 'react';
import { Button } from "@/app/(components)/ui/button"

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
  padding?: string; // Add padding prop
}

const GradientButton: React.FC<GradientButtonProps> = ({
    children,
    onClick,
    type = "button",
    className,
    disabled = false,
    padding = "py-3 px-4 sm:py-4 sm:px-6" // Default padding
}) => {
  return (
    <div
        className={`p-0.5 rounded-lg bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end ${className || ''}`}
    >
        <Button
            type={type}
            onClick={onClick}
            className={`w-full h-full ${padding} text-sm sm:text-base text-white rounded-md bg-gray-800 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${className || ''}`}
            disabled={disabled}
        >
            {children}
        </Button>
    </div>
  );
};

export default GradientButton;