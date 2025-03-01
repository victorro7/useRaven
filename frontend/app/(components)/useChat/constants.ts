export const generateId = (type: "user" | "assistant" | "message") => `${type}-${Date.now()}`;
export const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface ChatMessagePart {
  text: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'other';
}

export interface FormattedChatMessage {
  role: "user" | "data" | "assistant" | "system";
  parts: ChatMessagePart[];
  id: string;
}