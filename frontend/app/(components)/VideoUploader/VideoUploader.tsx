// app/(components)/VideoUploader/VideoUploader.tsx
import React, { useState, useRef, useCallback } from 'react';
import { FileIcon, UploadIcon, GoogleDriveIcon } from './icons';

interface VideoUploaderProps {
  onVideoUpload: (videoFile: File | null, videoUrl: string | null) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoUpload }) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onVideoUpload(file, null);
      }
    },
    [onVideoUpload]
  );

  const handleUrlChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setUrl(event.target.value);
    },
    []
  );

  const handleUrlSubmit = useCallback(() => {
    if (url.trim()) {
      onVideoUpload(null, url);
    } else {
      onVideoUpload(null, null);
    }
  }, [url, onVideoUpload]);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOver(false); // Reset dragOver state on drop
      const file = event.dataTransfer.files?.[0];
      if (file) {
        onVideoUpload(file, null);
      }
    },
    [onVideoUpload]
  );

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // Prevent default to allow drop
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    // Outer div for the gradient border
    <div
      className={`p-0.5 rounded-lg ${
        dragOver ? 'bg-blue-500' : 'bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Inner div for the content, with padding and solid background */}
      <div
        className={`p-8 text-center rounded-md ${
          dragOver ? 'bg-blue-50' : 'bg-gray-800' // Change background color on drag over
        }`}
        onClick={openFileDialog}
        style={{ cursor: 'pointer' }}
      >
        {/* Hidden file input */}
        <input
          type="file"
          accept="video/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {/* URL Input */}
        <div className="mb-4">
          <div className="flex items-center w-full">
            <FileIcon />
            <input
              type="text"
              placeholder="Drop a Zoom link"
              value={url}
              onChange={handleUrlChange}
              className="w-full p-2 bg-gray-700 text-gray-300 placeholder-gray-500 focus:outline-none resize-none text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Upload Options */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-4">
          <button
            type="button"
            className="flex items-center px-3 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 focus:outline-none text-sm sm:text-base"
            onClick={openFileDialog}
          >
            <UploadIcon/>
            Upload
          </button>
          <button
            type="button"
            className="flex items-center px-3 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 focus:outline-none text-sm sm:text-base"
            onClick={() => {
              /* Handle Google Drive integration later */
            }}
            disabled
          >
            <GoogleDriveIcon />
            Google Drive
          </button>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          className="w-full py-2 sm:py-3 bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end text-white font-semibold rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          onClick={handleUrlSubmit}
        >
          Get clips in 1 click
        </button>
      </div>
    </div>
  );
};

export default VideoUploader;