// app/choose/page.tsx
import React from 'react';
import Link from 'next/link';
import LogoIcon from '../(components)/icons/LogoIcon';

export default function ChooseToolPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#09090b] text-white">
      <div className="text-center mb-12">
        <LogoIcon />
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end">
          Hey, it's your first time!
        </h1>
        <p className="text-gray-400 mt-3 text-base sm:text-lg">Select the application you want to use:</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/raven">
          <button className="w-64 sm:w-80 px-6 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 text-lg sm:text-xl">
            Raven
          </button>
        </Link>
        <Link href="/klair">
          <button className="w-64 sm:w-80 px-6 py-3 rounded-lg bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end text-white hover:from-[#82e4dd] hover:to-[#f482f4] focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg sm:text-xl">
            Klair
          </button>
        </Link>
      </div>
    </div>
  );
}