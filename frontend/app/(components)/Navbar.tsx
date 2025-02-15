// app/(components)/Navbar.tsx
import React from 'react';
import Logo from './LogoIcon';

interface NavbarProps {
  title: string;
}

const Navbar: React.FC<NavbarProps> = ({ title }) => {
  return (
    <header className="text-gray-300 py-4 px-6 shadow-md flex items-center">
      <Logo />
      <h1 className="text-3xl font-semibold tracking-wide ml-4">{title}</h1>
    </header>
  );
};

export default Navbar;