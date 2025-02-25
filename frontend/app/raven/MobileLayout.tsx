// MobileLayout.tsx
import React from 'react';
import Navbar from '../(components)/Navbar';
import { ChatSidebar } from '../(components)/useChat/ChatSidebar';

interface MobileLayoutProps {
    children: React.ReactNode;
    chats: any[]; // Add props for ChatSidebar
    loadChat: (chatId: string) => void;
    createNewChat: () => void;
    deleteChat: (chatId: string, currentChatId: string | null) => void;
    renameChat: (chatId: string, newName: string) => void;
    messages: any[];
    fetchChats: ()  => Promise<void>;
    selectedChatId: string | null;
    disableNewChatButton: boolean;
}
const MobileLayout: React.FC<MobileLayoutProps> = ({
    children,
    chats,
    loadChat,
    createNewChat,
    deleteChat,
    renameChat,
    messages,
    fetchChats,
    selectedChatId,
    disableNewChatButton,
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
                    selectedChatId={selectedChatId}
                    disableNewChatButton={disableNewChatButton}
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