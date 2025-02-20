// app/(components)/ChatSidebar.tsx
"use client";
import React, { useState, useRef, useEffect } from "react"; // Import useRef and useEffect
import { Sidebar, SidebarBody, SidebarLink } from "./ui/sidebar";
import { IconMessage2, IconPlus, IconTrash, IconEdit } from "@tabler/icons-react"; // Import trash and edit icons
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

interface SidebarProps {
  chats: any[]; // Replace 'any' with your chat type
  loadChat: (chatId: string) => void;
  createNewChat: () => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newTitle: string) => void; // Add renameChat prop
}

export function ChatSidebar({ chats, loadChat, createNewChat, deleteChat, renameChat }: SidebarProps) {
    const [open, setOpen] = React.useState(false);
    const { user } = useUser();
    const [editingChatId, setEditingChatId] = useState<string | null>(null); // Track which chat is being edited
    const [editedTitle, setEditedTitle] = useState(''); // Store the edited title
    const inputRef = useRef<HTMLInputElement>(null); // Ref for the input field

    // Focus the input field when editing starts
    useEffect(() => {
      if (editingChatId && inputRef.current) {
        inputRef.current.focus();
      }
    }, [editingChatId]);

    const handleRenameClick = (chatId: string, currentTitle: string) => {
      setEditingChatId(chatId);
      setEditedTitle(currentTitle); // Initialize with current title
    };

    const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => { //Corrected
      setEditedTitle(event.target.value);
    };

    const handleSaveRename = async (chatId: string) => {
      if (editedTitle.trim() !== "") { // Prevent empty titles
        await renameChat(chatId, editedTitle.trim());
      }
        setEditingChatId(null); // Exit edit mode
        setEditedTitle("");
    };

    const handleCancelRename = () => {
      setEditingChatId(null); // Exit edit mode, discard changes
      setEditedTitle("")
    };

    //for esc and enter keys
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, chatId: string) => {
      if (event.key === 'Enter') {
          event.preventDefault(); // Prevent newline in contenteditable
          handleSaveRename(chatId); // Save on Enter
      } else if (event.key === 'p') {
          handleCancelRename(); // Cancel on Escape
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
              <SidebarLink
                link={{
                  label: "New Chat",
                  href: "#", // Use '#' to prevent navigation
                  icon: <IconPlus className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                }}
                onClick={(e) => {
                  e.preventDefault(); // Prevent default link behavior
                  createNewChat();
                }}
              />
              {chats.map((chat) => (
                  <div key={chat.chatId} className="flex items-center justify-between group">
                      <div className="flex-grow" >
                          <SidebarLink
                              link={{
                              label: "", // Empty label
                              href: "#",
                              icon: <IconMessage2 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                              id: chat.chatId // Add id prop
                              }}
                              onClick={(e) => {
                              e.preventDefault();
                              loadChat(chat.chatId);
                              }}
                          >
                          {/* Display Chat Title (Editable or Not) */}
                          {editingChatId === chat.chatId 
                          ? (
                              <input
                                  ref={inputRef}
                                  type="text"
                                  value={editedTitle}
                                  onChange={handleTitleChange}
                                  onBlur={() => handleSaveRename(chat.chatId)}
                                  onKeyDown={(e) => handleKeyDown(e, chat.chatId)}
                                  className="bg-white text-neutral-900  border rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                  onClick={(e)=>{
                                    e.stopPropagation();
                                  }}
                              />
                          ) : (
                            <span className="text-red-600 text-sm  transition duration-150 whitespace-pre inline-block !p-0 !m-0">
                                  {chat.title || `-Chat ${chat.chatId.substring(0, 8)}`}
                              </span>
                          )}
                          </SidebarLink>
                    </div>
                    {/* Edit and Delete Buttons (Show on hover) */}
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleRenameClick(chat.chatId, chat.title)}
                        className="text-gray-500 hover:text-blue-500 p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                        title="Rename Chat"
                      >
                        <IconEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteChat(chat.chatId)}
                        className="text-red-500 hover:text-red-700 p-1 rounded focus:outline-none focus:ring-2 focus:ring-red-400"
                        title="Delete Chat"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          {/* User Profile/Logout (Same as before)*/}
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
        Raven
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