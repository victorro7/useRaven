import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import UploadIcon from '../icons/UploadIcon';
import SendIcon from '../icons/SendIcon';
import { FormattedChatMessage } from '../useChat/constants';
import { FaFileAlt, FaVideo, FaFileAudio, FaTimes } from 'react-icons/fa';

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
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && (value.trim() || selectedFiles.length > 0)) {
        const formEvent = e as unknown as React.FormEvent;
        handleSubmit(formEvent);
      }
    }
  };

  const MAX_FILES = 20;
  const MAX_FILE_SIZE = 20 * 1024 * 1024;

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;
      handleFiles(Array.from(files));
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOver(false);
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

    const borderRadiusClass = previewUrls.length > 0 ? 'rounded-2xl' : 'rounded-3xl';

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
      setIsDragOver(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      // Only set to false if we're leaving the drop area entirely
      if (!dropAreaRef.current?.contains(e.relatedTarget as Node)) {
        setIsDragOver(false);
      }
    };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full">
      {/* Error Message */}
      {errorMessage && (
        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠</span>
            {errorMessage}
          </div>
        </div>
      )}
      
      {/* Gradient border container */}
      <div className={`relative p-[2px] ${borderRadiusClass} transition-all duration-300 ease-in-out
                      ${isDragOver 
                        ? 'bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 shadow-lg shadow-blue-500/20' 
                        : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400'
                      }`}>
        <div
        ref={dropAreaRef}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
          className={`
            w-full transition-all duration-300 ease-in-out relative
            ${borderRadiusClass}
            ${isDragOver 
              ? 'bg-black/80 border-2 border-dashed border-blue-400/30' 
              : 'bg-black'
            }
            backdrop-blur-sm hover:bg-black/95 focus-within:bg-black/95 focus-within:shadow-xl focus-within:shadow-blue-500/10
          `}>
        
        {/* Drag Overlay */}
        {isDragOver && (
          <div className={`absolute inset-0 flex items-center justify-center bg-blue-500/10 ${borderRadiusClass} z-10`}>
            <div className="text-blue-400 text-center">
              <div className="text-2xl mb-2">📁</div>
              <div className="text-sm font-medium">Drop files here</div>
            </div>
          </div>
        )}
        
        {/* File Preview (Images and Icons) */}
        {previewUrls.length > 0 && (
          <div className="p-3 border-b border-white/10">
            <div className="flex flex-row flex-wrap items-center gap-3">
              {previewUrls.map((previewUrl, index) => (
                <div
                  key={index}
                  className="relative group"
                >
                  <div className="relative overflow-hidden rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-black/20">
                    {previewUrl !== 'placeholder' ? (
                      <Image
                        src={previewUrl}
                        alt={`Preview ${index}`}
                        width={80}
                        height={80}
                        className="rounded-xl object-cover border border-white/20"
                      />
                    ) : (
                      <div className="w-20 h-20 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm rounded-xl border border-white/20">
                        <div className="mb-1">{getFileIcon(selectedFiles[index].type)}</div>
                        <div className="text-xs text-gray-400 font-medium text-center px-1 truncate w-full">
                          {selectedFiles[index].name.length > 8 
                            ? `${selectedFiles[index].name.substring(0, 8)}...` 
                            : selectedFiles[index].name
                          }
                        </div>
                      </div>
                    )}
                    
                    {/* Delete button with better styling */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full 
                                flex items-center justify-center text-xs font-bold transition-all duration-200 
                                opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg"
                      title="Remove file"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                  
                  {/* File name tooltip for images */}
                  {previewUrl !== 'placeholder' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-2 py-1 
                                    rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate">
                      {selectedFiles[index].name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col px-4 py-2">
          {/* Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask Raven..."
              className="w-full bg-transparent text-gray-200 placeholder-gray-400 focus:outline-none resize-none 
                        overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent text-sm leading-relaxed py-2 px-3"
              rows={1}
              style={{
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                maxHeight: '80px'
              }}
              disabled={disabled}
            />
            {value.length > 500 && (
              <div className="absolute bottom-0.5 right-1 text-xs text-gray-400 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/20">
                {value.length}
              </div>
            )}
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between">
            {/* Attach button */}
            <label htmlFor="file-upload" className="cursor-pointer flex-shrink-0">
              <input
                type="file"
                id="file-upload"
                accept="image/*,video/*,audio/*,application/pdf,.heic,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                onChange={handleFileChange}
                className="hidden"
                multiple
                disabled={disabled}
              />
               <UploadIcon />
            </label>

            {/* Send button */}
            <button 
              type="submit" 
              disabled={disabled || (!value.trim() && selectedFiles.length === 0)}
              className="flex items-center justify-center p-2 rounded-full transition-all duration-200 flex-shrink-0
                        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                        enabled:bg-black enabled:text-white enabled:hover:bg-gray-900
                        enabled:hover:scale-105 enabled:border enabled:border-white/20
                        enabled:active:scale-95"
              title={disabled || (!value.trim() && selectedFiles.length === 0) ? "Enter a message or select files" : "Send message (Enter)"}
            >
                <SendIcon />
            </button>
          </div>
        </div>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;