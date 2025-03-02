// app/(components)/AuthForm.tsx
"use client";
import React from 'react';
import { useSignIn } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Button } from "@/app/(components)/ui/button";
import GoogleLogo from '../icons/GoogleLogo';
import { useRouter } from 'next/navigation';

interface AuthFormProps {
  className?: string;
  redirect?: string;
}

export function AuthForm({ className, redirect = "/", ...props }: AuthFormProps) {
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
  const router = useRouter();

  // Only show loading state if Clerk is not loaded
  if (!isSignInLoaded) {
    return(
        //Just a test loading state.
        <div className="text-white flex items-center justify-center h-screen">
            <p>Loading...</p>
        </div>
    )
  }

  const signInWithOAuth = async (provider: 'google') => { //Simplified
    if (!signIn) return;

    try {
      // Use authenticateWithOAuth
      const result = await signIn.authenticateWithRedirect({
        strategy: `oauth_${provider}`, // Construct the strategy string
        redirectUrl: '/sso-callback',   // URL for the callback route
        redirectUrlComplete: redirect,       // Where to go after successful sign-in/up
      });
        console.log(result) //For debugging

    } catch (error: any) {
      console.error(`OAuth Sign-In Error (${provider}):`, error);
      // Display a user-friendly error message (using a toast, for example)
      alert(`Error signing in with ${provider}: ${error.message || error}`); // Basic error display
    }
  };


  return (
    <div className={cn("flex flex-col gap-6 p-0.5 bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end rounded-lg", className)} {...props}>
      <div className="max-w-full sm:max-w-[400px] bg-[#09090b] border-none rounded-md p-4 sm:p-6 mx-auto">
        <h2 className="text-xl sm:text-2xl text-white text-center font-semibold mb-2">
          Sign In / Sign Up
        </h2>
        <p className="text-sm sm:text-base text-gray-400 text-center mb-6">
          Sign in or create an account using your Google account.
        </p>

        <div className="flex flex-col gap-4">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center"
            onClick={() => signInWithOAuth('google')}>
            <GoogleLogo />
            <span className="ml-2">Continue with Google</span>
          </Button>
          <div id="clerk-captcha"></div>
        </div>
      </div>
    </div>
  );
}