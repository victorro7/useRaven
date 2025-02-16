// app/(components)/Navbar.tsx
import React from 'react';
import Logo from './LogoIcon';
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
  return (
    <header className=" py-4 px-6 shadow-md flex items-center">
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <Logo />
      <h1 className="text-3xl font-semibold tracking-wide ml-4">{title}</h1>
    </header>
  );
};

export default Navbar;

