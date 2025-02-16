// app/(components)/GradientButton.tsx
import React from 'react';
import { Button } from "@/components/ui/button"

interface GradientButtonProps {
  children: React.ReactNode; // The button text (or any other content)
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void; // Optional onClick handler
  type?: "button" | "submit" | "reset"; // Optional type attribute
  className?: string; // Optional additional classes
  disabled?: boolean;
}

const GradientButton: React.FC<GradientButtonProps> = ({
    children,
    onClick,
    type = "button", // Default to type="button"
    className,
    disabled = false
}) => {
  return (
    <Button
      type={type}
      onClick={onClick}
      className={
        `w-full text-sm sm:text-base bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end
         text-white hover:from-[#82e4dd] hover:to-[#f482f4] transition-colors duration-300
         ${className || ''}`
      }
      disabled={disabled}
    >
      {children}
    </Button>
  );
};

export default GradientButton;