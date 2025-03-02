// app/klair/upload/page.tsx  (Option 2: Move upload form here)
"use client"
import React, { useState, useRef } from 'react';
import { useVideoUpload } from '../(components)/useVideoUpload';

export default function VideoUploadPage() {
  const { uploadVideo, loading, error } = useVideoUpload();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));

      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
        URL.revokeObjectURL(video.src);
      };
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
      setVideoDuration(null);
    }
  };

  const handleUpload = async () => {
    if (selectedFile && videoDuration) {
      const gcsUrl = await uploadVideo(selectedFile, videoDuration);
      if (gcsUrl) {
        console.log('Video uploaded successfully! GCS URL:', gcsUrl);
        // You could redirect here, or display a success message
      } else {
        console.error("Video upload failed.");
      }
    }
  };

  return (
    <div>
      <h1>Upload Video (Klair)</h1>
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        ref={fileInputRef}
      />
      {previewUrl && (
        <video width="320" height="240" controls src={previewUrl} />
      )}
      {videoDuration && <p>Duration: {videoDuration.toFixed(2)} seconds</p>}
      <button className="text-white" onClick={handleUpload} disabled={loading || !selectedFile}>
        {loading ? 'Uploading...' : 'Upload Video'}
      </button>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
}