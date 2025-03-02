// app/(components)/useVideoUpload.ts (Corrected Order and Initial AI Interaction)
import { useCallback } from 'react';
import { useChats } from './useChat/useChats';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useApiRequest } from './useChat/useApiRequest';
import { useUser } from '@clerk/nextjs';

interface PresignedUrlResponse {
  url: string;
  gcs_url: string;
}

export const useVideoUpload = () => {
    const { createNewChat } = useChats(); // Get createNewChat function
    const router = useRouter();
    const { getToken } = useAuth();
    const { makeRequest, loading, error } = useApiRequest();
    const { user } = useUser(); // Get the user object


    const uploadVideo = useCallback(async (file: File, duration: number): Promise<string | null> => {
    try {
        const token = await getToken({ template: "kvbackend" });
        if(!token) {
            throw new Error("Not authenticated")
        }
      // 1. Get the presigned URL
      const presignedUrlResponse = await makeRequest<PresignedUrlResponse>({
        method: 'POST',
        path: '/api/klair/upload-url',
        body: {
          filename: file.name,
          contentType: file.type,
        },
        shouldAuthorize: true,
      });

      if (!presignedUrlResponse) {
        throw new Error('Failed to get presigned URL');
      }

      const { url, gcs_url } = presignedUrlResponse;

      // 2. Upload the file directly to GCS
      const uploadResponse = await fetch(url, { // Use fetch for direct GCS upload
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type, // MUST be the file's content type
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`GCS upload failed: ${uploadResponse.statusText}`);
      }

         // 3. Create a *NEW* chat for this video
        const userId = user?.id;
        if (!userId) {
            throw new Error("User ID not available.");
        }
        const newChat = await makeRequest<{ chat_id: string }>({
            method: 'POST',
            path: '/api/chats/creat',
            body: { user_id: userId, title: `Chat about ${file.name}` }, // Use userId
            shouldAuthorize: true
        });

        if (!newChat) {
            console.error("Failed to create new chat");
            return null;
        }
        const { chat_id } = newChat;

        // 4. Create Database Entry, *including* the chat_id
        const createVideoResponse = await makeRequest<{ video_id: number }>({
            method: 'POST',
            path: '/api/klair/videos',
            body: {
                filename: file.name,
                upload_url: gcs_url, // Use the *final* GCS URL
                duration_seconds: Math.round(duration), // Send duration
                chat_id: chat_id, // Include the chat_id
            },
            shouldAuthorize: true,
        });


      if (!createVideoResponse) {
        throw new Error("Failed to create video database entry");
      }

        const { video_id } = createVideoResponse;

        // 5. send initial message to the chat (initial prompt and the ai response)
        const initialPrompt = `Here is a link to a video: ${gcs_url}.  Provide a concise summary of the video.`;
        const aiResponse = await fetch('http://localhost:8000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                messages: [{ role: 'user', parts: [initialPrompt] }],
                chatId: null,  // IMPORTANT: No chat ID for the *initial* AI request
            }),
        });

        if (!aiResponse.ok) {
            const errorData = await aiResponse.json();
            throw new Error(errorData.detail || aiResponse.statusText);
        }

         const reader = aiResponse.body?.getReader();
            if (!reader) {
                throw new Error("No response body from server.");
            }
            let aiResponseText = "";
             while (true) {
                const { done, value } = await reader.read();
                if (done) {
                break;
                }
                const chunk = new TextDecoder().decode(value);
                aiResponseText += chunk;
            }

        // Extract just the text from the response, cleaning it up from JSON
        let cleanAiResponse = "";
        let lines = aiResponseText.split('\n');
        for (const line of lines) {
            if (line) {
                try {
                    const jsonChunk = JSON.parse(line);
                    if (jsonChunk.response) {
                        cleanAiResponse += jsonChunk.response
                    }
                } catch (parseError) {
                    console.error("Error parsing JSON in initial AI response:", parseError, line);
                    // You might want to handle this more gracefully in production
                }
            }
        }
        console.log("AI Initial Response", cleanAiResponse)
        const initialMessages = [
            { role: 'user', parts: [initialPrompt] }, // Include image URL here
            { role: 'assistant', parts: [cleanAiResponse] } // Initial AI response
        ];

        // Call add_messages_to_db directly via fetch, since we dont need a streaming response
        const addMessagesResponse = await fetch('http://localhost:8000/initialmessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                messages: initialMessages,
                chatId: chat_id, // Use newly created chatId
            }),
        });

      // 6. Navigate to the *video detail page*
      router.push(`/klair/video/${video_id}`);

      return gcs_url; // Return the GCS URL for potential use in the UI

    } catch (error: any) {
      console.error('Video upload error:', error);
      return null;
    }
  }, [getToken, makeRequest, createNewChat, router, user?.id]);

  return { uploadVideo, loading, error };
};