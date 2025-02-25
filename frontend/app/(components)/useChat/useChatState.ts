// app/(components)/useChatState.ts
import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';

export const useChatState = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); //general loading
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null); //general
  const params = useParams();
  const pathname = usePathname();
  const chatId = params.chatId as string | null;
  const [selectedChatId, setSelectedChatId] = useState<string | null>(chatId || null);

  useEffect(() => {
    const chatIdFromParams = params.chatId as string | null;
      setSelectedChatId(chatIdFromParams || null);
  }, [params.chatId, pathname]);

  return { input, setInput, isLoading, setIsLoading, isGenerating, setIsGenerating, error, setError, selectedChatId, setSelectedChatId };
};