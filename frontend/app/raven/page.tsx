// app/raven/page.tsx
"use client"

import { useChatLogic } from '@/app/(components)/useChatLogic';
import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Spinner from '@/app/(components)/icons/Spinner';

export default function Home() {
  const { fetchChats, createNewChat, chats } = useChatLogic();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

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