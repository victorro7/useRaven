// app/email-verification/page.tsx
'use client'; // This is a client component
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function EmailVerificationPage() {
  const router = useRouter();

  return (
    <div>
      <AuthenticateWithRedirectCallback
        afterAuth={() => {
          console.log("Email verification complete!");
          router.push('/'); // Redirect to where you want the user to go after verification
        }}
        onError={(error) => {
          console.error("Email verification error:", error);
          // Display the error to the user
        }}
      />
      <p>Verifying your email...</p> {/* Or a loading indicator */}
    </div>
  );
}