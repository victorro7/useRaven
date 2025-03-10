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
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSubmit, disabled}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // Store all files
  const [previewUrls, setPreviewUrls] = useState<string[]>([]); // Store preview URLs (images) or placeholders
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const MAX_FILES = 20;
  const MAX_FILE_SIZE = 20 * 1024 * 1024;

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;
      handleFiles(Array.from(files));
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const files = event.dataTransfer.files ? Array.from(event.dataTransfer.files) : [];
        handleFiles(files);
    };

    //Unified file handling
    const handleFiles = (files: File[]) => {
      const newFiles = Array.from(files);
      console.log(selectedFiles.length + newFiles.length)
      if (selectedFiles.length + newFiles.length > MAX_FILES) {
          setErrorMessage(`You can upload a maximum of ${MAX_FILES} files.`);
          return;
      }

      // Check file sizes
      for (const file of newFiles) {
        if (file.size > MAX_FILE_SIZE) {
          setErrorMessage(`File "${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
          return;
        }
      }

      // If all checks pass, add the files
      setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
      const newPreviews = newFiles.map((file) => {
          if (file.type.startsWith('image/')) {
              return URL.createObjectURL(file);
          } else {
              return 'placeholder';
          }
      });
      setPreviewUrls((prevPreviews) => [...prevPreviews, ...newPreviews]);
      setErrorMessage(null); // Clear any previous error
    }

    const handleRemoveFile = (indexToRemove: number) => {
      setSelectedFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
      setPreviewUrls((prevPreviews) => prevPreviews.filter((_, index) => index !== indexToRemove));
      setErrorMessage(null);
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
          return <FaVideo size={24} style={{ color: 'white' }}/>;
        } else if (fileType.startsWith('audio/')) {
          return <FaFileAudio size={24} style={{ color: 'white' }}/>;
        } else {
          return <FaFileAlt size={24} style={{ color: 'white' }}/>;
        }
      };

    // Drag and drop handlers
    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
    };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full">
      <div
      ref={dropAreaRef} // Attach the ref here
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
        className={`w-full p-1 ${borderRadiusClass} bg-gray-800`}>
        {/* File Preview (Images and Icons) */}
        {errorMessage && (
          <div className="text-red-500 mb-2">
            {errorMessage}
          </div>
        )}
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
                accept="image/*, .heic"
                onChange={handleFileChange}
                className="hidden"
                multiple
                disabled={disabled}
              />
              {/* video/*,audio/*,application/pdf,.heic,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv */}
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
              disabled={disabled}
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