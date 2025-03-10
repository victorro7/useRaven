export const generateId = (type: "user" | "assistant" | "message") => `${type}-${Date.now()}`;
export const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export interface ChatMessagePart {
  text: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'other';
  mimeType?: string;
  isTyping?: boolean;
}

export interface FormattedChatMessage {
  role: "user" | "data" | "assistant" | "system";
  parts: ChatMessagePart[];
  id: string;
}