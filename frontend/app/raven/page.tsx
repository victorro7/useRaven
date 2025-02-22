// app/raven/page.tsx
"use client"

import { useChatLogic } from '@/app/(components)/useChatLogic';
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import Spinner from '@/app/(components)/icons/Spinner';

export default function Home() {
  const { fetchChats, createNewChat, chats } = useChatLogic();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Fetch chats and create a new one if needed, *only once* on initial load.
  useEffect(() => {
      const handleInitialLoad = async () => {
          if (isSignedIn) {
              await fetchChats(); // Fetch existing chats FIRST
              if (chats.length === 0) {
                await createNewChat(); // Create a new chat ONLY if none exist
              }
          }
          setInitialLoadComplete(true);
      };

      // Only run this logic if it hasn't run before.
      if (!initialLoadComplete) {
        handleInitialLoad();
      }

  }, [isSignedIn, fetchChats, createNewChat, chats.length, initialLoadComplete]);

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