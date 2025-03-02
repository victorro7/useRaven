//app/(components)/useInitialChatLoad.ts
import { useEffect, useRef } from 'react';
import { useChats } from './useChats';
import { useChatMessages } from './useChatMessages';
import { useUser } from '@clerk/nextjs';
import { useChatState } from './useChatState';

export const useInitialChatLoad = (chatId: string | null) => {
  const { fetchChats, chats, createNewChat, deleteChat } = useChats();
  const { loadChatMessages } = useChatMessages();
  const { isSignedIn } = useUser();
  const initialLoad = useRef(false);
  const { setSelectedChatId } = useChatState();

  useEffect(() => {
    const handleInitialLoad = async () => {
      if (isSignedIn && !initialLoad.current) {
        initialLoad.current = true;
        await fetchChats();

        if (chatId) {
          setSelectedChatId(chatId);
          await loadChatMessages(chatId);
        } else if (chats.length === 0) {
          console.log("init: len of chats: ")
          console.log(chats.length);
          await createNewChat();
        }
      }
    };

    handleInitialLoad();
  }, [isSignedIn, chatId, setSelectedChatId, fetchChats, createNewChat, chats.length, loadChatMessages, deleteChat]); // Correct dependencies

};