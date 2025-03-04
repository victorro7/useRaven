// app/page.tsx
'use client'
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Spinner from './(components)/icons/Spinner';
import { TypewriterEffectSmooth } from "./(components)/ui/typewriter-effect";
import { BackgroundBeams } from "./(components)/ui/background-beams";

export default function LandingPage() {
    const { isLoaded, isSignedIn } = useUser();
    const router = useRouter();
    const words = [
      {
        text: "Hey,",
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

    useEffect(() => {
        if (isLoaded && isSignedIn) {
          router.push('/chat');
        }
    }, [isLoaded, isSignedIn, router]);

      if (!isLoaded) {
        <Spinner></Spinner>
      }

      //If is loaded but not signed in, show the landing page.
      if(!isSignedIn){
        return (
          <div className="flex flex-col items-center justify-center h-[40rem] text-white">
            <TypewriterEffectSmooth className="text-white" words={words} />
            <div className="z-10 flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-4">
            <Link href="/">
              <button className="w-40 h-10 rounded-xl bg-black border dark:border-white border-transparent text-white text-sm">
                Join now
              </button>
              </Link>
              <Link href="/">
              <button className="z-10 w-40 h-10 rounded-xl bg-white text-black border border-black  text-sm">
                Sign In
              </button>
              </Link>
            </div>
            <div className="hidden lg:block">
              <BackgroundBeams />
            </div>
          </div>
        );
    }
    //user is signed in, don't return anything.
    return null
}