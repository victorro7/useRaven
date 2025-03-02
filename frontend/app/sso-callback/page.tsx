// app/sso-callback/page.tsx
"use client"
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallbackPage() {
  return (
     <div className="flex items-center justify-center h-screen w-full bg-[#09090b] text-white">
        <AuthenticateWithRedirectCallback />
     </div>
    )
}