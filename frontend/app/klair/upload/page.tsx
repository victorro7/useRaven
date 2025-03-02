// app/klair/upload/page.tsx (Single Page for Upload and Interaction)
"use client"
import React, { useState, useRef } from 'react';
import { useKlairVideo } from '@/app/(components)/useKlairVideo'; // New hook

export default function KlairUploadPage() {
    const { uploadVideo, sendPrompt, videoUrl, messages, input, setInput, isLoading, error, videoDuration, setVideoDuration } = useKlairVideo();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null); // For video preview
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
             // Get video duration (client-side)
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.onloadedmetadata = () => {
                setVideoDuration(video.duration);
                URL.revokeObjectURL(video.src); // Clean up
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
            // Optionally, redirect to a video list page or display a success message
          } else {
            console.error("Video upload failed."); // improve this
          }
        }
      };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        await sendPrompt(input);
        setInput('');
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
                <video width="640" height="360" controls src={previewUrl} />
            )}
            {videoDuration && <p>Duration: {videoDuration.toFixed(2)} seconds</p>}
            <button className="text-white" onClick={handleUpload} disabled={isLoading || !selectedFile}>
                {isLoading ? 'Uploading...' : 'Upload Video'}
            </button>
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            <h2>Chat</h2>
            <div>
                {messages.map((message, index) => (
                    <p key={index}>{message}</p> // Simple display for now
                ))}
            </div>
             <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question about the video..."
                    disabled={isLoading || !videoUrl}
                />
                <button type="submit" disabled={isLoading || !videoUrl}>Send</button>
            </form>
        </div>
    );
}