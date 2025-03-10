// app/(components)/useChat/useChats.ts
import { useState, useCallback } from 'react';
import { useApiRequest } from './useApiRequest';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useChatState } from './useChatState';
import { useChatMessages } from '@/app/(components)/useChat/useChatMessages';

interface Chat {
  chatId: string;
  userId: string;
  title: string;
  createdAt: number;
}

export const useChats = () => {
  const { makeRequest, loading: isChatsLoading, error: chatsError } = useApiRequest();
  const [chats, setChats] = useState<Chat[]>([]);
  const { user } = useUser();
  const router = useRouter();
  const { setInput } = useChatState();
  const { setMessages } = useChatMessages();


  const fetchChats = useCallback(async () => {
      const data = await makeRequest<Chat[]>({ method: 'GET', path: '/api/chats' });
      if (data) {
          setChats(data);
      }
  }, [makeRequest]);

  const createNewChat = useCallback(async () => {
      setMessages([]); // Clear messages when creating a new chat
      setInput('');
      if (!user?.id) {
          throw new Error("User ID not available.");
      }
      const data = await makeRequest<{ chat_id: string }>({
            method: 'POST',
            path: '/api/chats/create',
            body: { user_id: user.id, title: null },
        });
      if (data) {
        setChats(prevChats => [{ chatId: data.chat_id, title: `New Chat`, userId: user.id!, createdAt: Date.now() }, ...prevChats]);
        router.push(`/chat/${data.chat_id}`);
      }
  }, [user?.id, router, setMessages, setInput]);

  const deleteChat = useCallback(async (chatId: string, currentChatId: string | null) => {
    const res = await makeRequest({ method: 'DELETE', path: `/api/chats/${chatId}` });
    if(res !== null){ //request was successful
      setChats(prevChats => prevChats.filter(chat => chat.chatId !== chatId));
    }
    if (currentChatId === chatId) {
      setMessages([]);
      router.push(`/chat`);
    }
  }, [router, setMessages, makeRequest, setChats]);

  const renameChat = useCallback(async (chatId: string, newTitle: string) => {

    const res = await makeRequest({
          method: 'PATCH',
          path: `/api/chats/${chatId}`,
          body: { title: newTitle },
      });
      if(res !== null){
        setChats(prevChats =>
            prevChats.map(chat =>
                chat.chatId === chatId ? { ...chat, title: newTitle } : chat
            )
        );
      }
  }, [setChats, makeRequest]);

  return { chats, setChats, fetchChats, createNewChat, deleteChat, renameChat, isChatsLoading, chatsError };
};