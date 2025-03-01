# backend/models.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

# --- Pydantic Models ---
class Message(BaseModel):
    role: str
    parts: list[str]

class ChatRenameRequest(BaseModel):
    title: str

class ChatMessagePart(BaseModel):
    text: str
    type: Optional[str] = None  # Use Optional, and default to None

class FormattedChatMessage(BaseModel):
    role: str
    parts: List[ChatMessagePart]

class ChatRequest(BaseModel):
    messages: list[FormattedChatMessage]
    chatId: Optional[str] = None

class ChatCreateRequest(BaseModel):
    user_id: str  # Get from Clerk
    title: Optional[str] = None

class ChatCreateResponse(BaseModel):
    chat_id: str

class ChatMessage(BaseModel): #for returning chat messages.
    messageId: str
    role: str
    content: str
    timestamp: float
    media_type: str | None = None
    media_url: str | None = None

class Chat(BaseModel): #for returning chats.
    chatId: str
    userId: str
    title: Optional[str]
    createdAt: float

class PresignedUrlRequest(BaseModel):
    filename: str
    contentType: str

class PresignedUrlResponse(BaseModel):
    url: str  # The presigned URL for PUT
    gcs_url: str  # The final, public URL of the object in GCS

class VideoCreateRequest(BaseModel):
    filename: str
    upload_url: str
    duration_seconds: int
    # file_uri: str #No longer needed

class VideoCreateResponse(BaseModel):
    video_id: int

class Video(BaseModel):
    id: int
    user_id: str
    filename: str
    upload_url: str
    duration_seconds: int
    created_at: float  # Use float for epoch time
    chat_id: Optional[str] = None
# --- Pydantic Models ---