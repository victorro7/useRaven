// app/(components)/AuthForm.tsx
"use client";
import React from 'react';
import { useSignIn } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import AppleLogo from './AppleLogo'; // Your custom component
import GoogleLogo from './GoogleLogo'; // Your custom component

interface AuthFormProps {
  className?: string;
}

export function AuthForm({ className, ...props }: AuthFormProps) {
  const { signIn, isLoaded } = useSignIn();

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  const signInWithOAuth = async (provider: 'google' | 'apple') => { //Simplified
    if (!signIn) return;

    try {
      // Use authenticateWithOAuth
      const result = await signIn.authenticateWithRedirect({
        strategy: `oauth_${provider}`, // Construct the strategy string
        redirectUrl: '/sso-callback',   // URL for the callback route
        redirectUrlComplete: '/',       // Where to go after successful sign-in/up
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
      <div  className="w-full sm:w-[400px] bg-[#09090b] border-none rounded-md p-8">
        <h2 className="text-xl sm:text-2xl text-white text-center font-semibold mb-2">
          Sign In / Sign Up
        </h2>
        <p className="text-sm sm:text-base text-gray-400 text-center mb-6">
          Sign in or create an account using your Google or Apple account.
        </p>

        <div className="flex flex-col gap-4">
            <Button
                variant="outline"
                className="w-full text-white flex items-center justify-center"
                onClick={() => signInWithOAuth('apple')}
            >
            <AppleLogo />
            <span className="ml-2">Continue with Apple</span>
            </Button>

            <Button
            variant="outline"
            className="w-full text-white flex items-center justify-center"
            onClick={() => signInWithOAuth('google')}
            >
            <GoogleLogo />
            <span className="ml-2">Continue with Google</span>
            </Button>
        </div>
      </div>
    </div>
  );
}