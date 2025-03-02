/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(components)/ChatSidebar.tsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../ui/sidebar";
import { IconMessage2, IconPlus, IconTrash, IconEdit } from "@tabler/icons-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

interface SidebarProps {
  chats: any[];
  createNewChat: () => void;
  loadChat?: (chatId: string) => void;
  deleteChat: (chatId: string, currentChatId: string | null) => void;
  renameChat: (chatId: string, newTitle: string) => void;
  fetchChats?: ()  => Promise<void>;
  selectedChatId: string | null;
  disableNewChatButton: boolean;
}

export function ChatSidebar({ chats, createNewChat, deleteChat, renameChat, selectedChatId, disableNewChatButton }: SidebarProps) {
  const [open, setOpen] = React.useState(false);
  const { user } = useUser();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingChatId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingChatId]);

  const handleRenameClick = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditedTitle(currentTitle);
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTitle(event.target.value);
  };

  const handleSaveRename = async (chatId: string) => {
    if (editedTitle.trim() !== "") {
      await renameChat(chatId, editedTitle.trim());
    }
    setEditingChatId(null);
    setEditedTitle("");
  };

  const handleCancelRename = () => {
    setEditingChatId(null);
    setEditedTitle("")
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, chatId: string) => {
      if (event.key === 'Enter') {
          event.preventDefault();
          handleSaveRename(chatId);
      } else if (event.key === 'Escape') {
          handleCancelRename();
      }
  }

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10" onClick={(e) => {
            // Check if the click target is the input field or a descendant of the input field
            if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
                handleCancelRename(); // Call handleCancelRename to exit edit mode
            }
        }}>
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {open ? <Logo /> : <LogoIcon />}
          <div className="mt-8 flex flex-col gap-2">
            {/* New Chat Button */}
            <button
              disabled={disableNewChatButton}
              onClick={createNewChat}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-700 transition"
            >
              <IconPlus className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
              <span className="text-sm text-black">New Chat</span>
            </button>
            {/* New Chat Button */}

            {/* Chat List */}
            {chats.map((chat) => (
              <div key={chat.chatId} className="flex items-center justify-between group">
                <Link
                    href={`/raven/chat/${chat.chatId}`}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md w-full",  // Apply to the Link
                      // selectedChatId === chat.chatId ? "bg-gray-700" : "bg-gray-700 transition"
                    )}
                >
                    <IconMessage2 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />

                    {editingChatId === chat.chatId ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editedTitle}
                        onChange={handleTitleChange}
                        onBlur={(e) => {
                            e.preventDefault();
                            handleSaveRename(chat.chatId)
                        }}
                        onKeyDown={(e) => handleKeyDown(e, chat.chatId)}
                        className="bg-white text-neutral-900 border rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      />
                    ) : (
                      <span className="text-black text-sm  transition duration-150 whitespace-pre inline-block !p-0 !m-0">
                          {chat.title || `-Chat ${chat.chatId.substring(0, 8)}`}
                      </span>
                    )}
                </Link>

                {/* Edit and Delete Buttons */}
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleRenameClick(chat.chatId, chat.title)}
                        className="text-gray-500 hover:text-blue-500 p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                        title="Rename Chat"
                      >
                        <IconEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteChat(chat.chatId, selectedChatId)}
                        className="text-red-500 hover:text-red-700 p-1 rounded focus:outline-none focus:ring-2 focus:ring-red-400"
                        title="Delete Chat"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                </div>
                {/* Edit and Delete Buttons */}
              </div>
            ))}
          </div>
        </div>

        {/* User Profile/Logout*/}
        <div>
            {user && (
              <SidebarLink
                link={{
                  label: user.firstName || "User",
                  href: "#",
                  icon: (
                    <Image
                      src={user.imageUrl}
                      className="h-7 w-7 flex-shrink-0 rounded-full"
                      width={50}
                      height={50}
                      alt="Avatar"
                    />
                  ),
                }}
              />
            )}
            <SidebarLink
                link={{
                  label: "Logout",
                  href: "#", // Use '#'
                  icon: <IconMessage2 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                  // You could add lastMessageSnippet and timestamp here
                }}
                onClick={async (e) => {
                  e.preventDefault();
                  //TODO: Implement
                }}
              />
        </div>
        {/* User Profile/Logout*/}
      </SidebarBody>
    </Sidebar>
  );
}

export const Logo = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </Link>
  );
};