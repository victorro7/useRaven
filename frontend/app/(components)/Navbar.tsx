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
    <header className="bg-[#09090b] text-gray-300 py-4 px-6 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        {/*  Left Side: UserButton, Logo, and Title */}
        <div className="flex items-center">
          <LogoIcon className="h-8 w-8 text-primary mr-2" />
          <h1 className="text-3xl font-semibold tracking-wide">{title}</h1>
        </div>

        {/* Right Side: Dropdown Button and Menu */}
        <div className="relative inline-block text-left" ref={dropdownRef}>
          <button
            type="button"
            className="inline-flex justify-center items-center p-2 text-gray-400 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={toggleMenu}
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
          >
            {/* Down Arrow Icon */}
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
              <div className="py-1" role="none">
                <Link href="/klair" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    Klair
                </Link>
                <Link href="/" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    Home
                </Link>
                <Link href="/raven" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                  Raven
                </Link>
                {/* Add more menu items here */}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;