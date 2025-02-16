// app/(components)/Navbar.tsx
import React, { useState } from 'react'; // Import useState
import Link from 'next/link'; // Import Link if not already imported
import Logo from './icons/LogoIcon';
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs'

interface NavbarProps {
  title: string;
}

const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="text-gray-300 py-4 px-6 shadow-md flex items-center gap-1 relative"> {/* Add relative for positioning */}
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <Logo />
      <h1 className="text-3xl font-semibold tracking-wide ml-2">{title}</h1>

      {/* Dropdown Button */}
      <button onClick={toggleDropdown} className="ml-auto"> {/* Position to the right */}
        Tools {/* Or a suitable icon */}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-10"> {/* Position absolutely */}
        <Link href="/" className="block px-4 py-2 text-gray-300 hover:bg-gray-700">
            Home
          </Link>
          <Link href="/raven" className="block px-4 py-2 text-gray-300 hover:bg-gray-700">
            Raven
          </Link>
          <Link href="/klair" className="block px-4 py-2 text-gray-300 hover:bg-gray-700">
            Klair
          </Link>
          {/* Add more links as needed */}
        </div>
      )}
    </header>
  );
};

export default Navbar;