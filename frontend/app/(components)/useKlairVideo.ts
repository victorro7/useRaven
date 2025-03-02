// app/(components)/useKlairVideo.ts (NEW HOOK)
import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';

interface PresignedUrlResponse {
    url: string;
    gcs_url: string;
}

export const useKlairVideo = () => {
    const { getToken } = useAuth();
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [messages, setMessages] = useState<string[]>([]); // Simple string array for now
    const [input, setInput] = useState('');
    const { user } = useUser(); // Get user for ID
    const [videoDuration, setVideoDuration] = useState<number | null>(null);

    const uploadVideo = useCallback(async (file: File, duration:number) => {
        setIsLoading(true);
        setError(null);
        setMessages([]); // Clear previous messages
        setVideoUrl(null); // Clear previous video URL

        try {
            const token = await getToken({ template: "kvbackend" });
            if(!token) {
                throw new Error("Not authenticated")
            }
             const userId = user?.id;
            if (!userId) {
                throw new Error("User ID not available.");
            }
            // 1. Get Presigned URL
            const presignedUrlResponse = await fetch('http://localhost:8000/api/klair/upload-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ filename: file.name, contentType: file.type }),
            });

            if (!presignedUrlResponse.ok) {
                const errorData = await presignedUrlResponse.json();
                throw new Error(errorData.detail || presignedUrlResponse.statusText);
            }

            const { url, gcs_url } = await presignedUrlResponse.json() as PresignedUrlResponse;

            // 2. Upload Directly to GCS
            const uploadResponse = await fetch(url, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });

            if (!uploadResponse.ok) {
                throw new Error(`GCS upload failed: ${uploadResponse.statusText}`);
            }

            // 3. Create Database Entry,
            const createVideoResponse = await fetch('http://localhost:8000/api/klair/videos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    filename: file.name,
                    upload_url: gcs_url, // Use the *final* GCS URL
                    duration_seconds: Math.round(duration), // Send duration
                }),
            });
            if (!createVideoResponse.ok) {
                const errorData = await createVideoResponse.json();
                throw new Error(errorData.detail || createVideoResponse.statusText);
            }
            const { video_id } = await createVideoResponse.json();
          setVideoUrl(gcs_url); // Set the video URL for display/interaction
          return gcs_url
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [getToken, user?.id]);

    const sendPrompt = useCallback(async (promptText: string) => {
        if (!videoUrl) {
            setError("No video uploaded.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setMessages((prevMessages) => [...prevMessages, `User: ${promptText}`]);
        try {
             const token = await getToken({ template: "kvbackend" });
            if(!token) {
                throw new Error("Not authenticated")
            }
            const response = await fetch('http://localhost:8000/api/klair/chat', { // New endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Include Clerk token
                },
                body: JSON.stringify({
                    video_url: videoUrl,  // Send the GCS URL
                    prompt: promptText,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || response.statusText);
            }
            const data = await response.json();
             setMessages((prevMessages) => [...prevMessages, `AI: ${data.response}`]); // Add AI response

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [videoUrl, getToken]);

    return { uploadVideo, sendPrompt, videoUrl, messages, input, setInput, isLoading, error, videoDuration, setVideoDuration };
};