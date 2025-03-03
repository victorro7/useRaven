// app/page.tsx
'use client'
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Spinner from './(components)/icons/Spinner';
import { TypewriterEffectSmooth } from "./(components)/ui/typewriter-effect";

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
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-4">
            <Link href="/sign-in">
              <button className="w-40 h-10 rounded-xl bg-black border dark:border-white border-transparent text-white text-sm">
                Join now
              </button>
              </Link>
              <Link href="/sign-in">
              <button className="w-40 h-10 rounded-xl bg-white text-black border border-black  text-sm">
                SignIn
              </button>
              </Link>
            </div>
          </div>
        );
        // return (
        //     <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] text-white">
        //       <div className="text-center mb-12">
        //         <LogoIcon className="h-16 w-16 mx-auto mb-6 text-primary" />
        //         <h1 className="text-5xl sm:text-6xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end">
        //           [Name]...
        //         </h1>
        //         <p className="text-gray-400 mt-4 text-lg sm:text-xl max-w-prose">
        //           Empowering creators with AI-driven tools.
        //         </p>
        //         <p className="mt-2 text-base sm:text-lg text-gray-400">
        //           Choose your tool below and get started.
        //         </p>

        //         <div className="mt-10">
        //             {/* Always redirect to /sign-in, let AuthForm handle the redirect prop */}
                  // <Link href="/sign-in">
                  //   <button className="w-full sm:w-auto px-8 py-3 rounded-full bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end text-white font-semibold text-lg sm:text-xl hover:from-[#82e4dd] hover:to-[#f482f4] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                  //     Get Started
                  //   </button>
                  // </Link>
        //         </div>
        //         <p className="mt-4 text-sm text-gray-400">
        //           Already have an account?{' '}
        //           <Link href="/sign-in" className="text-blue-500 hover:text-blue-600 underline">
        //             Sign In
        //           </Link>
        //         </p>
        //       </div>

        //       {/* Footer */}
        //       <footer className="bg-[#09090b] text-gray-400 py-4 text-center">
        //         © {new Date().getFullYear()} Raven. All rights reserved.
        //       </footer>
        //     </div>
        //   );
    }
    //user is signed in, don't return anything.
    return null
}