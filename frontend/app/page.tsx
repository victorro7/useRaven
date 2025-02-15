// app/page.tsx
'use client';

import React, { useState, useCallback } from 'react';
import Navbar from './(components)/Navbar';
import VideoUploader from './(components)/VideoUploader/VideoUploader';
import VideoPlayer from './(components)/VideoPlayer';
import ClipList from './(components)/ClipList';

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const handleVideoUpload = useCallback(async (file: File | null, url: string | null) => {
    try {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('http://localhost:8000/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Upload Success (Frontend):', data);
          setFileUrl(`/uploads/${data.filename}`); // Correct relative URL
          setVideoFile(file);
          setVideoUrl(null);
        } else {
          const errorData = await response.json();
          console.error('Upload Error (Frontend):', errorData);
          // Handle error (e.g., show a toast notification)
        }
      } else if (url) {
          const formData = new FormData();
          formData.append('url', url);
          const response = await fetch('http://localhost:8000/api/process-url', {
            method: 'POST',
            body: formData,
          });

          if(response.ok){
            const data = await response.json();
            console.log("URL Process Success (Frontend)", data)
            setFileUrl(url);
            setVideoUrl(url);
            setVideoFile(null)
          } else {
            const errorData = await response.json();
            console.error("URL Process Error (Frontend):", errorData)
          }
      }
    } catch (error) {
      console.error('Error (Frontend):', error);
      // Handle network errors, etc.
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-white">
      <Navbar title="Klair" />

      <main className="flex-grow overflow-y-auto p-2 sm:p-4 flex justify-center">
        <div className="w-full sm:max-w-2xl mx-auto flex flex-col lg:flex-row gap-4">
          {/* Video Player (Larger) */}
          <div className="lg:w-2/3">
            <VideoPlayer src={fileUrl} />
          </div>

          {/* Uploader and Clip List (Stacked on small, side-by-side on large) */}
          <div className="lg:w-1/3 flex flex-col gap-4">
            <VideoUploader onVideoUpload={handleVideoUpload} />
            <ClipList />
          </div>
        </div>
      </main>
    </div>
  );
}