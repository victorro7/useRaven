// app/raven/layout.tsx
"use client"
import React, { useState, useEffect } from "react";
import { ChatSidebar } from '../(components)/ChatSidebar';
import Navbar from '../(components)/Navbar';
import { useChatLogic } from '../(components)/useChatLogic';
import { useUser } from '@clerk/nextjs';
import Spinner from '../(components)/icons/Spinner';

interface LayoutProps {
  children: React.ReactNode;
}

export default function RavenLayout({ children }: LayoutProps) {
    const { messages, isLoading, createNewChat, chats, setChats, fetchChats, deleteChat, renameChat, loadChat } = useChatLogic();
    const { user, isLoaded, isSignedIn } = useUser();
    const [hasInteracted, setHasInteracted] = useState(false);

    // Fetch chats on component mount (or user login)
    useEffect(() => {
      const fetchData = async () => { //named function
        if (isSignedIn) {
          await fetchChats(); // Await fetchChats
        }
      };

      fetchData();
    }, [isSignedIn, fetchChats]);

    useEffect(() => {
        if(isLoading) {
            //loading done, no typing
        }
    }, [isLoading])

    useEffect(() => {
        if (!isLoading && hasInteracted) {
            //loading + typing done
        }
    }, [isLoading, hasInteracted]);

    if (!isLoaded || !isSignedIn) {
        return (
        <div className="flex justify-center items-center h-screen">
            <Spinner size="lg" color="white" />
        </div>
        );
    }
    const userName = user?.firstName || 'User';

  return (
    <div className="flex h-screen bg-[#09090b] text-black">
      <ChatSidebar chats={chats} loadChat={loadChat} createNewChat={createNewChat} deleteChat={deleteChat} renameChat={renameChat} messages={messages} fetchChats={fetchChats}/>
      <div className="flex-grow flex flex-col">
        <Navbar title="Raven" />
        {/* This is where the page content will be rendered */}
        <main className="flex-grow overflow-y-auto p-2 sm:p-4">
          {children}
        </main>
      </div>
    </div>
  );
}