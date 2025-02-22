// app/raven/page.tsx
"use client"

import React from 'react';
import { useUser } from '@clerk/nextjs';
import Spinner from '@/app/(components)/icons/Spinner';

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" color="white" />
      </div>
    );
  }

  return (
    <>
    </>
  )
}