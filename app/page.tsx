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

  const handleVideoUpload = useCallback(
    (file: File | null, url: string | null) => {
      if (file) {
        setVideoFile(file);
        setVideoUrl(null);
        setFileUrl(URL.createObjectURL(file));
      } else if (url) {
        setVideoUrl(url);
        setVideoFile(null);
        setFileUrl(url);
      }
    }, []);

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-white">
      <Navbar title="Klair" />

      <main className="flex-grow overflow-y-auto p-2 sm:p-4 flex justify-center">
        <div className="w-full max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-4">

          {/* Video Player (Larger) */}
          <div className="w-full lg:w-2/3 lg:flex lg:flex-col items-center"> {/* Center horizontally */}
            <VideoPlayer src={fileUrl} />
            <div className="mt-4 w-full flex justify-center"> {/* Add margin top and center the uploader */}
              <VideoUploader onVideoUpload={handleVideoUpload} />
            </div>
          </div>

          {/* Uploader and Clip List (Stacked on small, side-by-side on large) */}
          <div className="w-full lg:w-1/3 flex flex-col gap-4">
            <ClipList />
          </div>

        </div>
      </main>
    </div>
  );
}