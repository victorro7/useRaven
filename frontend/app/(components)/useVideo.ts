// app/(components)/useVideo.ts (New Hook)
import { useState, useEffect, useCallback } from 'react';
import { useApiRequest } from './useChat/useApiRequest';

interface Video {
  id: number;
  user_id: string;
  filename: string;
  upload_url: string;
  duration_seconds: number;
  created_at: string; // Use string for dates from API
  chat_id: string | null;
}

export const useVideo = (videoId: string) => {
  const { makeRequest, loading, error } = useApiRequest();
  const [video, setVideo] = useState<Video | null>(null);

  const getVideo = useCallback(async () => {
    const data = await makeRequest<Video>({
      method: 'GET',
      path: `/api/klair/videos/${videoId}`,
    });
    if (data) {
      setVideo(data);
    }
  }, [videoId, makeRequest]);

  useEffect(() => {
    getVideo();
  }, [getVideo]);

  return { video, loading, error, getVideo };
};