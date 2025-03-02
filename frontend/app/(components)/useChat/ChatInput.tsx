import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import UploadIcon from '../icons/UploadIcon';
import SendIcon from '../icons/SendIcon';
import { FormattedChatMessage } from '../useChat/constants';
import { FaFileAlt, FaVideo, FaFileAudio } from 'react-icons/fa';

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent, files: File[]) => void;
  messages: FormattedChatMessage[];
}

const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSubmit}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // Store all files
  const [previewUrls, setPreviewUrls] = useState<string[]>([]); // Store preview URLs (images) or placeholders
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);

      // Generate previews (URLs for images, placeholders for others)
      const newPreviews = Array.from(files).map((file) => {
        if (file.type.startsWith('image/')) {
          return URL.createObjectURL(file);
        } else {
          return 'placeholder'; // Use a placeholder string
        }
      });
      setPreviewUrls((prevPreviews) => [...prevPreviews, ...newPreviews]);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
    setPreviewUrls((prevPreviews) => prevPreviews.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(event, selectedFiles);
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  const borderRadiusClass = previewUrls.length > 0 ? 'rounded-lg' : 'rounded-[1rem]';

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const adjustHeight = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

    // Helper function to get icon based on file type
    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith('video/')) {
          return <FaVideo size={24} />;
        } else if (fileType.startsWith('audio/')) {
          return <FaFileAudio size={24} />;
        } else {
          return <FaFileAlt size={24} />; // Default icon for documents/other
        }
      };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full">
      <div className={`w-full p-1 ${borderRadiusClass} bg-gray-800`}>
        {/* File Preview (Images and Icons) */}
        {previewUrls.length > 0 && (
          <div className="flex flex-row flex-wrap items-center gap-2 p-2">
            {previewUrls.map((previewUrl, index) => (
              <div
                key={index}
                className="relative"
                onMouseEnter={() => {
                  const deleteButton = document.getElementById(`delete-button-${index}`);
                  if (deleteButton) {
                    deleteButton.classList.remove('hidden');
                  }
                }}
                onMouseLeave={() => {
                  const deleteButton = document.getElementById(`delete-button-${index}`);
                  if (deleteButton) {
                    deleteButton.classList.add('hidden');
                  }
                }}
              >
                {previewUrl !== 'placeholder' ? (
                  <Image
                    src={previewUrl}
                    alt={`Preview ${index}`}
                    width={64}
                    height={64}
                    className="rounded-md object-cover"
                  />
                ) : (
                  // Display icon based on file type
                  <div className="w-16 h-16 flex items-center justify-center bg-gray-700 rounded-md">
                      {getFileIcon(selectedFiles[index].type)}
                  </div>
                )}
                <button
                  type="button"
                  id={`delete-button-${index}`}
                  onClick={() => handleRemoveFile(index)}
                  className="absolute top-1 right-1 bg-[#5b5bd1cb] text-white rounded-full p-1 text-xs hover:bg-red-700 hidden"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col w-full min-h-[40px] max-h-[120px] overflow-hidden">
          <div className="flex items-center py-2">
            <label htmlFor="file-upload" className="cursor-pointer">
              <input
                type="file"
                id="file-upload"
                accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" // Accept multiple types
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
              <div className='self-start'><UploadIcon /></div>
            </label>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={onChange}
              placeholder="Talk to Raven"
              className="flex-grow bg-transparent text-gray-300 placeholder-gray-500 focus:outline-none ml-1 resize-none h-full overflow-y-auto w-full"
              rows={1}
              style={{
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            />
            <button type="submit" className="w-6 h-6 text-gray-500 hover:text-[#5b5bd1cb] mr-3">
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;