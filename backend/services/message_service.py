# backend/services/message_service.py
from typing import List, Optional, Tuple
import asyncpg
from ..pymodels import ChatMessage, ChatMessagePart, FormattedChatMessage


class MessageHistoryService:
    """Service class for managing chat message history and windowing."""
    
    @staticmethod
    async def get_recent_messages(
        db: asyncpg.Connection, 
        chat_id: str, 
        user_id: str, 
        limit: int = 20,
        exclude_latest: int = 0
    ) -> List[FormattedChatMessage]:
        """
        Retrieve the last N messages from the database for a given chat.
        
        Args:
            db: Database connection
            chat_id: Chat identifier
            user_id: User identifier (for security)
            limit: Maximum number of messages to retrieve
            exclude_latest: Number of most recent messages to exclude (to avoid duplicates)
            
        Returns:
            List of FormattedChatMessage objects ordered chronologically (oldest first)
        """
        try:
            # First verify the chat belongs to the user
            chat_query = "SELECT id FROM raven_chats WHERE id = $1 AND user_id = $2"
            chat = await db.fetchrow(chat_query, chat_id, user_id)
            if not chat:
                return []

            # Fetch recent messages with their media (excluding latest N if specified)
            query = """
                SELECT id, role, content, media_type, media_url, 
                       EXTRACT(EPOCH FROM timestamp) as timestamp
                FROM raven_messages
                WHERE chat_id = $1
                ORDER BY timestamp DESC
                LIMIT $2 OFFSET $3
            """
            print(f"DEBUG: MessageHistoryService - Fetching {limit} messages, excluding latest {exclude_latest}")
            rows = await db.fetch(query, chat_id, limit, exclude_latest)
            print(f"DEBUG: MessageHistoryService - Retrieved {len(rows)} database rows")
            
            # Group messages by role and timestamp to reconstruct conversation turns
            messages = []
            current_message = None
            
            # Process in reverse order to get chronological flow
            for row in reversed(rows):
                role = row['role']
                content = row['content']
                media_type = row['media_type']
                media_url = row['media_url']
                
                # If this is a new message (different role or significant time gap)
                if current_message is None or current_message.role != role:
                    # Save previous message if exists
                    if current_message is not None:
                        messages.append(current_message)
                    
                    # Start new message
                    current_message = FormattedChatMessage(role=role, parts=[])
                
                # Add text content if present
                if content and content.strip():
                    current_message.parts.append(
                        ChatMessagePart(text=content.strip(), type="text", mimeType=None)
                    )
                
                # Add media content if present
                if media_type and media_url:
                    current_message.parts.append(
                        ChatMessagePart(text=media_url, type=media_type.split('/')[0], mimeType=media_type)
                    )
            
            # Add the last message
            if current_message is not None:
                messages.append(current_message)
            
            return messages
            
        except Exception as e:
            print(f"Error retrieving message history: {e}")
            return []

    @staticmethod
    async def format_conversation_for_model(
        messages: List[FormattedChatMessage]
    ) -> Tuple[str, List]:
        """
        Format a list of messages into a prompt string and media parts for the model.
        
        Args:
            messages: List of FormattedChatMessage objects
            
        Returns:
            Tuple of (prompt_string, media_parts_list)
        """
        from ..utils import convert_storage_path
        from google.genai import types
        
        prompt_lines: List[str] = []
        media_parts: List[types.Part] = []
        
        for message in messages:
            for part in message.parts:
                if part.type == "text":
                    if part.text and part.text.strip():
                        prompt_lines.append(f"{message.role.upper()}: {part.text}")
                else:
                    if part.text:
                        try:
                            # Convert to gsutil URI format (gs://) for model consumption
                            gs_uri = convert_storage_path(part.text, 'gs_uri')
                            print(f"Adding media to history - Original URL: {part.text}")
                            print(f"Adding media to history - Converted to gs:// URI: {gs_uri}")
                            
                            # Create media part
                            media_part = types.Part.from_uri(file_uri=gs_uri, mime_type=part.mimeType)
                            print(f"Added media part to history with URI: {gs_uri}")
                            media_parts.append(media_part)
                        except Exception as e:
                            # Fallback: include as text reference if Part creation fails
                            print(f"Failed to create media Part for history: {e}")
                            clean_url = convert_storage_path(part.text, 'public_url')
                            prompt_lines.append(f"{message.role.upper()}: MEDIA({part.mimeType}): {clean_url}")
        
        prompt_lines.append("ASSISTANT:")
        prompt = "\n".join(prompt_lines)
        return prompt, media_parts
