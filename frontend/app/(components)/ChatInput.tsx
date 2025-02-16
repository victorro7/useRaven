import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import UploadIcon from './icons/UploadIcon';
import SendIcon from './icons/SendIcon';

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent, data?: { imageUrl?: string; imageFiles?: File[] }) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSubmit }) => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImageFiles = Array.from(files);
      setImageFiles((prevFiles) => [...prevFiles, ...newImageFiles]);
      const newImageUrls = newImageFiles.map((file) => URL.createObjectURL(file));
      setImageUrls((prevUrls) => [...prevUrls, ...newImageUrls]);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImageFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
    setImageUrls((prevUrls) => prevUrls.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const data = {
      imageUrl: imageUrls.length > 0 ? imageUrls[0] : undefined,
      imageFiles: imageFiles,
    };
    onSubmit(event, data);
    setImageUrls([]);
    setImageFiles([]);
  };

  const borderRadiusClass = imageUrls.length > 0 ? 'rounded-lg' : 'rounded-[1rem]';

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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full">
      <div className={`w-full p-1 ${borderRadiusClass} bg-gray-800`}>
        {/* Image Preview */}
        {imageUrls.length > 0 && (
          <div className="flex flex-row flex-wrap items-center gap-2 p-2">
            {imageUrls.map((imageUrl, index) => (
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
                <Image
                    src={imageUrl}
                    alt={`Preview ${index}`}
                    width={64}
                    height={64}
                    className="rounded-md object-cover"
                  />
                <button
                  type="button"
                  id={`delete-button-${index}`}
                  onClick={() => handleRemoveImage(index)}
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
            <label htmlFor="image-upload" className="cursor-pointer">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageChange}
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