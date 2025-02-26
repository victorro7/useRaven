// app/raven/layout.tsx
"use client"
import React, { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
import { ChatSidebar } from '../(components)/useChat/ChatSidebar';
import Navbar from '../(components)/Navbar';
import { useUser } from '@clerk/nextjs';
import Spinner from '@/app/(components)/icons/Spinner';
import MobileLayout from '@/app/raven/MobileLayout';
import { useChats } from '@/app/(components)/useChat/useChats';
import { useChatMessages } from '@/app/(components)/useChat/useChatMessages';
import { useChatState } from '@/app/(components)/useChat/useChatState';

interface LayoutProps {
    children: React.ReactNode;
    messages: any[];
}

export default function RavenLayout({ children }: LayoutProps) {
    const params = useParams();
    const chatId = params.chatId as string;
    const { isLoaded, isSignedIn } = useUser();
    const [isMobile, setIsMobile] = useState(false); // Add isMobile state
    const { input, selectedChatId, setSelectedChatId } = useChatState();
    const { chats, createNewChat, deleteChat, renameChat, fetchChats } = useChats();
    const { messages, isMessagesLoading, loadChatMessages, submitMessage} = useChatMessages();

    // --- COMBINED INITIAL LOAD AND CHAT LOADING ---
    useEffect(() => {
        const handleInitialLoad = async () => {
        if (isSignedIn) {
            await fetchChats(); // Always fetch chats first
            if (chatId) {
                // If there's a chatId in the URL, load that chat
                setSelectedChatId(chatId);
                await loadChatMessages(chatId);

            } else if (chats.length === 0) {
            // If there's no chatId AND no existing chats, create a new chat
                // console.log(chats.length)
                // await createNewChat();
            }
            // If there's no chatId and there ARE existing chats, do nothing (display the chat list)
        }
        };

        handleInitialLoad();
        // All necessary dependencies are included:
    }, [isSignedIn, chatId, setSelectedChatId, fetchChats, createNewChat, chats.length, loadChatMessages]);


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

    const disableNewChatButton = (selectedChatId && (chats.length == 0)) || (chats.length == 0);
    // const disableNewChatButton = (selectedChatId && messages.length === 0) || // Disable if in a chat AND no messages
    //  (!selectedChatId && chats.length == 0);
    // const disableNewChatButton = (selectedChatId && messages.length === 0) || // Disable if in a chat AND no messages
    //(!selectedChatId && chats.length == 0);// Disable if not in a chat AND chats exist

    if (isMobile) {
        return (
          <div className="h-screen bg-[#09090b]">
            <MobileLayout
                chats={chats}
                loadChat={loadChatMessages}
                createNewChat={createNewChat}
                deleteChat={deleteChat}
                renameChat={renameChat}
                messages={messages}
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
            <div className="flex h-screen bg-[#09090b] text-black">
            <ChatSidebar disableNewChatButton={disableNewChatButton} chats={chats} createNewChat={createNewChat} deleteChat={deleteChat} renameChat={renameChat} messages={messages} selectedChatId={selectedChatId} />
            <div className="flex flex-col flex-grow">
                <Navbar title="Raven" />
                <main className="flex-grow bg-[#09090b]">
                    {children}
                </main>
            </div>
        </div>
        
    );
}