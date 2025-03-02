// app/sign-in/page.tsx
"use client"
import { AuthForm } from '../(components)/auth/AuthForm';

export default function Page() {
  const redirectUrl =  "/raven"

  return (
    <div className="flex items-center justify-center h-screen bg-[#09090b]">
      <AuthForm redirect={redirectUrl}/>
    </div>
  );
}