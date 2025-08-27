// app/raven/layout.tsx
"use client"
import React, { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
import { ChatSidebar } from '../(components)/useChat/ChatSidebar';
import Navbar from '../(components)/Navbar';
import { useUser } from '@clerk/nextjs';
import Spinner from '@/app/(components)/icons/Spinner';
import MobileLayout from '@/app/chat/MobileLayout';
import { useChats } from '@/app/(components)/useChat/useChats';
import { useChatMessages } from '@/app/(components)/useChat/useChatMessages';
import { useChatState } from '@/app/(components)/useChat/useChatState';

interface LayoutProps {
    children: React.ReactNode;
}

export default function RavenLayout({ children }: LayoutProps) {
    const params = useParams();
    const chatId = params.chatId as string;
    const { isLoaded, isSignedIn } = useUser();
    const [isMobile, setIsMobile] = useState(false);
    const { selectedChatId } = useChatState();
    const { chats, createNewChat, deleteChat, renameChat, fetchChats } = useChats();
    const { messages, loadChatMessages } = useChatMessages();

    // --- COMBINED INITIAL LOAD AND CHAT LOADING ---
    useEffect(() => {
        const handleInitialLoad = async () => {
        if (isSignedIn) {
            await fetchChats(); // Always fetch chats first
        }
        };

        handleInitialLoad();
        // All necessary dependencies are included:
    }, [isSignedIn, chatId]);


    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 640); // Check for 'sm' breakpoint
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Empty dependency array for mount/unmount

    // Load current chat messages in this layout so we can determine emptiness
    useEffect(() => {
        if (selectedChatId) {
            loadChatMessages(selectedChatId);
        }
    }, [selectedChatId, loadChatMessages]);

    if (!isLoaded || !isSignedIn) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner size="lg" color="white" />
            </div>
        );
    }

    // Disable creating a new chat when the current chat has no messages
    const disableNewChatButton = Boolean(selectedChatId) && messages.length === 0;

    if (isMobile) {
        return (
          <div className="z-10 h-screen bg-[#09090b]">
            <MobileLayout
                chats={chats}
                loadChat={loadChatMessages}
                createNewChat={createNewChat}
                deleteChat={deleteChat}
                renameChat={renameChat}
                fetchChats={fetchChats}
                selectedChatId={selectedChatId}
                disableNewChatButton={disableNewChatButton}
            >
                {children}
            </MobileLayout>
          </div>
        );
    }

    return (
            <div className="z-10 flex h-screen bg-[#09090b] text-black">
            <ChatSidebar disableNewChatButton={disableNewChatButton} chats={chats} createNewChat={createNewChat} deleteChat={deleteChat} renameChat={renameChat} selectedChatId={selectedChatId} />
            <div className="flex flex-col flex-grow">
                <Navbar title="Raven" />
                <main className="flex-grow bg-[#09090b]">
                    {children}
                </main>
            </div>
        </div>
    );
}