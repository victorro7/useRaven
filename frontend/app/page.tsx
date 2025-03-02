// app/page.tsx
'use client'
import Link from 'next/link';
import LogoIcon from './(components)/icons/LogoIcon';
import { useUser } from '@clerk/nextjs'; // Import useUser
import { useRouter } from 'next/navigation'; // Import useRouter
import { useEffect } from 'react';
import Spinner from './(components)/icons/Spinner';

export default function LandingPage() {
    const { isLoaded, isSignedIn } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && isSignedIn) {
          router.push('/raven'); // Redirect to /raven if signed in
        }
    }, [isLoaded, isSignedIn, router]);

      if (!isLoaded) {
        <Spinner></Spinner>
      }

      //If is loaded but not signed in, show the landing page.
      if(!isSignedIn){
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] text-white">
              <div className="text-center mb-12">
                <LogoIcon className="h-16 w-16 mx-auto mb-6 text-primary" />
                <h1 className="text-5xl sm:text-6xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end">
                  [Name]...
                </h1>
                <p className="text-gray-400 mt-4 text-lg sm:text-xl max-w-prose">
                  Empowering creators with AI-driven tools.
                </p>
                <p className="mt-2 text-base sm:text-lg text-gray-400">
                  Choose your tool below and get started.
                </p>

                <div className="mt-10">
                    {/* Always redirect to /sign-in, let AuthForm handle the redirect prop */}
                  <Link href="/sign-in">
                    <button className="w-full sm:w-auto px-8 py-3 rounded-full bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end text-white font-semibold text-lg sm:text-xl hover:from-[#82e4dd] hover:to-[#f482f4] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                      Get Started
                    </button>
                  </Link>
                </div>
                <p className="mt-4 text-sm text-gray-400">
                  Already have an account?{' '}
                  <Link href="/sign-in" className="text-blue-500 hover:text-blue-600 underline">
                    Sign In
                  </Link>
                </p>
              </div>

              {/* Products Section */}
              <div className="bg-gray-800 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                  <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-8">Products</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {/* Raven Card */}
                    <div className="p-6 bg-gray-700 rounded-lg shadow-md">
                      <LogoIcon className="h-10 w-10 mb-4 text-primary" /> {/* Replace with Raven Icon if available */}
                      <h3 className="text-xl font-semibold text-white mb-2">Raven</h3>
                      <p className="text-gray-400">
                        Your AI-powered chat assistant. Get instant answers, generate creative text, and streamline your communication.
                      </p>
                    </div>

                    {/* Klair Card */}
                    <div className="p-6 bg-gray-700 rounded-lg shadow-md">
                      <LogoIcon className="h-10 w-10 mb-4 text-primary" /> {/* Replace with Klair Icon if available */}
                      <h3 className="text-xl font-semibold text-white mb-2">Klair</h3>
                      <p className="text-gray-400">
                        Coming Soon SHHH...
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <footer className="bg-[#09090b] text-gray-400 py-4 text-center">
                © {new Date().getFullYear()} KlairVoyant. All rights reserved.
              </footer>
            </div>
          );
    }
    //user is signed in, don't return anything.
    return null
}