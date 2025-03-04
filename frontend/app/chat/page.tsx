// app/raven/page.tsx
"use client"
import React from 'react';
import Spinner from '@/app/(components)/icons/Spinner';
import { useUser } from '@clerk/nextjs';
import { TypewriterEffectSmooth } from "@/app/(components)/ui/typewriter-effect";
import { BackgroundBeams } from "@/app/(components)/ui/background-beams";

export default function Home() {
  const { user, isLoaded, isSignedIn } = useUser();

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" color="white" />
      </div>
    );
  }
  const userName = user?.firstName || '';

  const words = [
    {
      text: "Hey",
      className:"text-2xl sm:text-4xl font-medium text-transparent text-white"
    },
    {
      text: `${userName}!`,
      className:"text-2xl sm:text-4xl font-medium text-transparent text-white"
    },
    {
      text: "Welcome",
      className:"text-2xl sm:text-4xl font-medium text-transparent text-white"
    },
    {
      text: "To",
      className:"text-2xl sm:text-4xl font-medium text-transparent text-white"
    },
    {
      text: "Raven.",
      className:"text-2xl sm:text-4xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#6ee1fc] to-[#fc5efc]"
    },
  ];


  return (
    <div className="bg-[#09090b] w-full mx-auto flex flex-col h-full">
        {/* Intro */}
        {(
            <div className="flex items-center justify-center h-full">
                <h2 className="text-2xl sm:text-4xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#6ee1fc] to-[#fc5efc]">
                   <TypewriterEffectSmooth className="text-white" words={words} />
                </h2>
                <BackgroundBeams />
            </div>
        )}
    </div>
);
}