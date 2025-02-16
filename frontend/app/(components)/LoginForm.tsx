// app/(components)/LoginForm.tsx
"use client"
import React, { useState } from 'react';
import { useSignIn } from "@clerk/nextjs";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from 'next/navigation';
import AppleLogo from './AppleLogo';
import GoogleLogo from './GoogleLogo';
import GradientButton from './GradientButton';

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {

  const { signIn, isLoaded } = useSignIn();
  const [identifier, setIdentifier] = useState(''); // Email or username
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!signIn) {
      console.error("Clerk sign-in object is not available");
      return;
    }

    try {
      const result = await signIn.create({
        identifier,  // Use the 'identifier' for email/username
        password,
      });

      if (result.status === "complete") {
        console.log(result);
        router.push('/');
      } else {
        console.log(result);
        // Handle other states (2FA, email verification, etc.)
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.errors?.[0]?.longMessage || 'An unexpected error occurred.');
    }
  };

  return (
    // Outer div with gradient background and padding
    <div className={cn("flex flex-col gap-6 p-0.5 bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end rounded-lg", className)} {...props}>
      <Card className="w-full sm:w-[400px] bg-[#09090b] border-none rounded-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl sm:text-2xl text-white">Welcome back</CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-400">
            Login with your Apple or Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-4">
              <Button variant="outline" className="w-full">
                <AppleLogo />
                Login with Apple
              </Button>
              <Button variant="outline" className="w-full ">
                <GoogleLogo />
                Login with Google
              </Button>
            </div>

            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-gray-700">
              <span className="relative z-10 bg-[#09090b] px-2 text-gray-400">
                Or continue with
              </span>
            </div>

            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="identifier" className="sr-only">
                  Email or Username
                </Label>
                {/* Single Input for Email/Username */}
                <Input
                    id="identifier"
                    type="text"
                    placeholder="Email or username"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="text-sm sm:text-base bg-gray-800 text-gray-300 placeholder-gray-500 border-0"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="sr-only">Password</Label>
                  <a
                    href="/reset-password" // gotta create this page
                    className="ml-auto text-sm text-white hover:text-primary-purple "
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-sm sm:text-base bg-gray-800 text-gray-300 placeholder-gray-500 border-0"
                />
              </div>
              <GradientButton type="submit">
                Login
              </GradientButton>
            </div>

            <div className="text-center text-sm text-gray-400">
              Don't have an account?{" "}
              <a href="/sign-up" className="text-white hover:text-primary-purple">
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
      {error && (
        <div className="w-full sm:w-[400px] text-red-500 text-center bg-primary-black p-2 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}