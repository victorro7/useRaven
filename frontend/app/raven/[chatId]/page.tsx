"use client"
import { useChatLogic } from '@/app/(components)/useChatLogic';
import ChatMessage from '@/app/(components)/ChatMessage';
import Spinner from '@/app/(components)/icons/Spinner';
import { useParams } from 'next/navigation'
import React, { useEffect } from 'react'

export default function page() {
    const params = useParams();
    const {messages, loadChat, isLoading, error} = useChatLogic();
    const chatId = params.chatId as string; // Extract chat ID

    useEffect(() => {
        if(chatId){
            loadChat(chatId)
        }

    }, [chatId, loadChat])
  return (
    <>
    {isLoading && <div className="text-gray-500">Loading...</div>}
    {error && (
        <div className="text-red-500">
        An error occurred: {error}
        </div>
    )}
     <div className="flex-grow overflow-y-auto">
        {messages.map((message) => (
            <ChatMessage
            key={message.id}
            role={message.role}
            content={message.parts.map((p) => p.text).join('')}
            imageUrl={message.role === 'user' ? message.parts[0]?.text.match(/(https?:\/\/[^\s]+)/)?.[0] : undefined}
            />
        ))}
    </div>
    </>

  )
}