// app/(components)/VideoPlayer/VideoPlayer.tsx
import React, { useRef, useEffect } from 'react';

interface VideoPlayerProps {
    src: string | null; // Can be a file URL or a regular URL
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && src) {
      // If you need to do something when the source changes.
      // This a good place to check video compatibility.
    }
  }, [src]);

  if (!src) {
    return <div className="w-full h-64 bg-gray-700 rounded-md flex items-center justify-center text-gray-400">No Video Selected</div>;
  }

  return (
    <div className="w-full relative">
      <video
        ref={videoRef}
        controls
        className="w-full rounded-md"
        src={src}
        style={{ maxHeight: '500px' }} // Limit height for responsiveness
      />
    </div>
  );
};

export default VideoPlayer;