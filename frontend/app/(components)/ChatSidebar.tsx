"use client";
import React from "react";
import { Sidebar, SidebarBody, SidebarLink } from "./ui/sidebar";
import { IconMessage2, IconPlus } from "@tabler/icons-react"; // Example icons
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { useUser, UserButton, SignOutButton } from "@clerk/nextjs";

interface SidebarProps {
  chats: any[]; // Replace 'any' with your chat type
  loadChat: (chatId: string) => void;
  createNewChat: () => void;
}

export function ChatSidebar({ chats, loadChat, createNewChat }: SidebarProps) {
  const [open, setOpen] = React.useState(false); // Or manage open state higher up
  const { user } = useUser();
  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
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
              <SidebarLink
                key={chat.id}
                link={{
                  label: chat.title,
                  href: "#", // Use '#'
                  icon: <IconMessage2 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                  // You could add lastMessageSnippet and timestamp here
                }}
                onClick={(e) => {
                  e.preventDefault();
                  loadChat(chat.id);
                }}
              />
            ))}
          </div>
        </div>
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
            <SignOutButton>
              <button>
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
            </button>
          </SignOutButton>
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
        {/* can add text here */}
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
