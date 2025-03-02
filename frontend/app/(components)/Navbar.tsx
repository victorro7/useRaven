// app/(components)/Navbar.tsx
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import LogoIcon from './icons/LogoIcon';

interface NavbarProps {
  title: string;
}

const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isSignedIn, isLoaded } = useUser();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-[#09090b] w-full text-gray-300 py-4 px-6 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        {/*  Left Side: UserButton, Logo, and Title */}
        <div className="flex items-center">
          <LogoIcon className="h-8 w-8 text-primary mr-2" />
          <h1 className="text-3xl font-semibold tracking-wide">{title}</h1>
        </div>
      </div>
    </header>
  );
};

export default Navbar;