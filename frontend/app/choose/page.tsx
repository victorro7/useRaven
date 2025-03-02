// app/choose/page.tsx
'use client'
import React from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import LogoIcon from '../(components)/icons/LogoIcon';
import GradientBorderButton from '../(components)/buttons/GradientBorderButton';
import Spinner from '../(components)/icons/Spinner';

export default function ChooseToolPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    <Spinner />
    // return null;
  }

  const userName = user?.firstName || 'User';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] text-white">
      <div className="text-center mb-10 sm:mb-12">
        <LogoIcon className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end">
          Hey {userName}!
        </h1>
        <p className="text-gray-400 mt-3 text-base sm:text-lg">
          Select the application you want to use:
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-md px-4">
        {/* Raven Button */}
        <Link href="/raven" className="flex-1">
        <button className="flex items-center justify-center w-full h-full px-6 py-4 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 text-lg sm:text-xl">
            <LogoIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
            <div>
              <span>Raven</span>
              <p className="text-xs sm:text-sm text-gray-400">AI-powered chat assistant.</p>
            </div>
          </button>
        </Link>

        {/* Klair Button */}
        <Link href="/klair" className="cursor-not-allowed flex-1">
        <GradientBorderButton className="w-full h-full">
            <div className="flex items-center justify-center w-full h-full px-6 py-4 rounded-lg text-lg sm:text-xl">
              <LogoIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
              <div>
                <span>Klair</span>
                <p className="text-xs sm:text-sm text-gray-400">Coming soon SHHH...</p>
              </div>
            </div>
          </GradientBorderButton>
        </Link>
      </div>
    </div>
  );
}