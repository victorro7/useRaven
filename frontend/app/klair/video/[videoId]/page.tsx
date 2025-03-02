// app/klair/video/[videoId]/page.tsx (New Video Detail Page)
"use client"
import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useVideo } from '@/app/(components)/useVideo';
import ChatInput from '@/app/(components)/useChat/ChatInput';
import ChatMessage from '@/app/(components)/useChat/ChatMessage';
import { useChatMessages } from '@/app/(components)/useChat/useChatMessages';
import { useChatState } from '@/app/(components)/useChat/useChatState';
import Spinner from '@/app/(components)/icons/Spinner';

// app/klair/video/[videoId]/page.tsx (New Video Detail Page)
// "use client"
// import React, { useEffect } from 'react';
// import { useParams } from 'next/navigation';
// import { useVideo } from '@/app/(components)/useVideo'; // New hook
// import ChatInput from '@/app/(components)/ChatInput';
// import ChatMessage from '@/app/(components)/ChatMessage';
// import { useChatMessages } from '@/app/(components)/useChatMessages';
// import { useChatState } from '@/app/(components)/useChatState';
// import Spinner from '@/app/(components)/icons/Spinner';

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params.videoId as string; // Ensure it's a string
  const { chatId } = params;

  const { video, loading: videoLoading, error: videoError } = useVideo(videoId);
  const { input, setInput, isLoading, isGenerating, error } = useChatState();
  const { messages, loadChatMessages, submitMessage, isMessagesLoading, messagesError } = useChatMessages(); //use existing chat messages

  const handleFormSubmit = async (event: React.FormEvent, imageFiles: File[]) => {
        event.preventDefault();
        if (!input.trim() && imageFiles.length === 0) return;
        setInput('');
        await submitMessage(input, imageFiles);
  };

  useEffect(() => {
    if (chatId) { //make sure the video data and chat id exist before loading messages
        loadChatMessages(chatId)
    }
  }, [chatId, loadChatMessages]);

  if (videoLoading || isLoading || isMessagesLoading) {
    return <div className="flex justify-center items-center h-full"><Spinner /></div>;
  }

  if (videoError || messagesError) {
    return <div className="text-red-500">Error: {videoError || messagesError}</div>;
  }

  if (!video) {
    return <div>Video not found.</div>;
  }

  return (
    <div>
      <h1>Video Detail Page: {video.filename}</h1>

      <video width="640" height="480" controls src={video.upload_url} />

      <p>Uploaded: {new Date(video.created_at).toLocaleString()}</p>
      <p>Duration: {video.duration_seconds} seconds</p>

      <h2>Chat</h2>
      <div>
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.parts.map((p) => p.text).join('')}
          />
        ))}
      </div>
      <ChatInput
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onSubmit={handleFormSubmit}
        messages={messages}
      />
    </div>
  );
}