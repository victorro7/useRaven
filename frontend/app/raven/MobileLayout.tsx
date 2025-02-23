// MobileLayout.tsx
import React from 'react';
import Navbar from '../(components)/Navbar';
import { ChatSidebar } from '../(components)/ChatSidebar';

interface MobileLayoutProps {
    children: React.ReactNode;
    chats: any[]; // Add props for ChatSidebar
    loadChat: (chatId: string) => void;
    createNewChat: () => void;
    deleteChat: (chatId: string) => void;
    renameChat: (chatId: string, newName: string) => void;
    messages: any[];
    fetchChats: ()  => Promise<void>;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
    children,
    chats,
    loadChat,
    createNewChat,
    deleteChat,
    renameChat,
    messages,
    fetchChats
}) => {
    return (
        <div className="flex flex-col h-screen text-black">
            <div className="flex bg-[#09090b] items-center">
                <ChatSidebar
                    chats={chats}
                    loadChat={loadChat}
                    createNewChat={createNewChat}
                    deleteChat={deleteChat}
                    renameChat={renameChat}
                    messages={messages}
                    fetchChats={fetchChats}
                />
                <Navbar title="Raven" />
            </div>
             <div className="flex-grow overflow-hidden bg-[#09090b]">
                {children}
            </div>
        </div>
    );
};

export default MobileLayout;