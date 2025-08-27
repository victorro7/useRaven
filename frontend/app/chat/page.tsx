// app/raven/page.tsx
"use client"
import React from 'react';
import { useUser } from '@clerk/nextjs';
import { TypewriterEffectSmooth } from "@/app/(components)/ui/typewriter-effect";
import { BackgroundBeams } from "@/app/(components)/ui/background-beams";

export default function Home() {
  const { user } = useUser();
  const userName = user?.firstName || '';
  const words = [
    {
      text: `Hey${userName ? ',' : ''}`,
      className:"text-2xl sm:text-4xl font-medium text-transparent text-white"
    },
    {
      text: "Welcome",
      className:"text-2xl sm:text-4xl font-medium text-transparent text-white"
    },
    ...(userName ? [{ text: userName, className:"text-2xl sm:text-4xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#6ee1fc] to-[#fc5efc]" }] : []),
  ];

  return (
    <div className="bg-[#09090b] w-full mx-auto flex flex-col h-full">
        {/* Intro */}
        {(
            <div className="flex items-center justify-center h-full">
                <h2 className="text-2xl sm:text-4xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#6ee1fc] to-[#fc5efc]">
                   <TypewriterEffectSmooth className="text-white" words={words} />
                </h2>
                <div className="hidden lg:block">
                  <BackgroundBeams />
                </div>
            </div>
        )}
    </div>
  );
}