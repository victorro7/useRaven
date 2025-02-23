// app/raven/layout.tsx
"use client"
import React, { useState, useEffect } from "react";
import { ChatSidebar } from '../(components)/ChatSidebar';
import Navbar from '../(components)/Navbar';
import { useChatLogic } from '../(components)/useChatLogic';
import { useUser } from '@clerk/nextjs';
import Spinner from '@/app/(components)/icons/Spinner';
import MobileLayout from '@/app/raven/mobileLayout';

interface LayoutProps {
    children: React.ReactNode;
}

export default function RavenLayout({ children }: LayoutProps) {
    const { messages, input, setInput, isLoading, error, createNewChat, chats, setChats, fetchChats, deleteChat, renameChat, loadChat } = useChatLogic();
    const { user, isLoaded, isSignedIn } = useUser();
    const [hasInteracted, setHasInteracted] = useState(false);
    const [isMobile, setIsMobile] = useState(false); // Add isMobile state

    // Fetch chats on component mount (or user login)
    useEffect(() => {
        const fetchData = async () => {
            if (isSignedIn) {
                await fetchChats(); // Await fetchChats
            }
        };

        fetchData();
    }, [isSignedIn, fetchChats]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 640); // Check for 'sm' breakpoint
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Empty dependency array for mount/unmount

    if (!isLoaded || !isSignedIn) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner size="lg" color="white" />
            </div>
        );
    }

    
    if (isMobile) {
        return (
          <div className="h-screen bg-[#09090b]">
            <MobileLayout
                chats={chats}
                loadChat={loadChat}
                createNewChat={createNewChat}
                deleteChat={deleteChat}
                renameChat={renameChat}
                messages={messages}
                fetchChats={fetchChats}
            >
                {children}
            </MobileLayout>
          </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#09090b] text-black">
            <ChatSidebar chats={chats} loadChat={loadChat} createNewChat={createNewChat} deleteChat={deleteChat} renameChat={renameChat} messages={messages} fetchChats={fetchChats} />
            <div className="flex flex-col flex-grow">
                <Navbar title="Raven" />
                <main className="flex-grow bg-[#09090b]">
                    {children}
                </main>
            </div>
        </div>
    );
}