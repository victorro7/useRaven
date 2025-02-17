// app/sign-in/page.tsx
"use client"
import { AuthForm } from '../(components)/auth/AuthForm';
import { useSearchParams } from 'next/navigation'

export default function Page() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || "/" //Using params

  return (
    <div className="flex items-center justify-center h-screen bg-[#09090b]">
      <AuthForm redirect={redirectUrl}/>
    </div>
  );
}