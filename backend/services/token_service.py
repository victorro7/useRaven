# backend/services/token_service.py
import os
from typing import List, Optional
from google import genai
from google.genai import types
from ..pymodels import FormattedChatMessage, ChatMessagePart


class TokenService:
    """Service for counting and managing tokens in messages."""
    
    def __init__(self):
        # Use the same client configuration as chat_service
        project_ID = os.getenv("PROJECT_ID", "careful-aleph-452520-k9")
        location = os.getenv("LOCATION", "us-central1")
        self.client = genai.Client(vertexai=True, project=project_ID, location=location)
        self.model_name = os.getenv("RAVEN_MODEL", "gemini-2.5-flash")
        
        # Token budgets from environment
        self.max_context_tokens = int(os.getenv("MAX_CONTEXT_TOKENS", "8000"))
        self.target_window_tokens = int(os.getenv("TARGET_WINDOW_TOKENS", "6000"))  # Leave room for response
    
    async def count_message_tokens(self, message: FormattedChatMessage) -> int:
        """
        Count tokens for a single message including text and media.
        
        Args:
            message: FormattedChatMessage with text and/or media parts
            
        Returns:
            Total token count for the message
        """
        try:
            # Build content for token counting
            content_parts = []
            
            for part in message.parts:
                if part.type == "text" and part.text:
                    content_parts.append(types.Part(text=part.text))
                elif part.type in ["image", "video", "audio", "application"] and part.text:
                    # For media, we'll estimate tokens based on type
                    # Note: We're using gs:// URIs, so we'll estimate based on media type
                    tokens = self._estimate_media_tokens(part)
                    print(f"DEBUG: Token counting - Estimated {tokens} tokens for {part.type} media")
                    print(f"DEBUG: Token counting - Media URL: {part.text[:100]}...")
                    print(f"DEBUG: Token counting - Media MIME: {getattr(part, 'mimeType', 'N/A')}")
                    return tokens  # For now, assume one media item per message
            
            if not content_parts:
                return 0
                
            # Count tokens using Google API
            token_response = self.client.models.count_tokens(
                model=self.model_name,
                contents=content_parts
            )
            
            total_tokens = int(token_response.total_tokens)
            print(f"DEBUG: Counted {total_tokens} tokens for message")
            return total_tokens
            
        except Exception as e:
            print(f"Error counting tokens: {e}")
            # Fallback: estimate based on text length
            return self._estimate_text_tokens(message)
    
    def _estimate_media_tokens(self, part: ChatMessagePart) -> int:
        """
        Estimate tokens for media based on type and Google's documented rates.
        
        Args:
            part: Media part with type and mimeType
            
        Returns:
            Estimated token count
        """
        if part.type == "image":
            # Images: 258 tokens for small images, 258 per 768x768 tile for larger
            # We'll use conservative estimate of 258 tokens per image
            return 258
        elif part.type == "video":
            # Video: 263 tokens per second
            # Without duration info, estimate 10 seconds average
            return 263 * 10  # 2630 tokens for ~10 second video
        elif part.type == "audio":
            # Audio: 32 tokens per second  
            # Without duration info, estimate 30 seconds average
            return 32 * 30  # 960 tokens for ~30 second audio
        elif part.type == "application":
            # PDFs and documents: estimate based on file size/type
            # Conservative estimate of 1000 tokens for documents
            return 1000
        else:
            return 100  # Default fallback
    
    def _estimate_text_tokens(self, message: FormattedChatMessage) -> int:
        """
        Fallback method to estimate tokens from text length.
        Rough approximation: ~4 characters per token for English.
        """
        total_chars = 0
        for part in message.parts:
            if part.type == "text" and part.text:
                total_chars += len(part.text)
        
        # Rough estimate: 4 characters ≈ 1 token
        estimated_tokens = max(1, total_chars // 4)
        print(f"DEBUG: Estimated {estimated_tokens} tokens from {total_chars} characters")
        return estimated_tokens
    
    def calculate_token_budget(self, messages: List[dict]) -> tuple[List[dict], int]:
        """
        Filter messages to fit within token budget, starting from most recent.
        
        Args:
            messages: List of message dicts with 'token_count' field
            
        Returns:
            Tuple of (filtered_messages, total_tokens_used)
        """
        if not messages:
            return [], 0
            
        filtered_messages = []
        total_tokens = 0
        
        # Process messages from newest to oldest
        for message in reversed(messages):
            message_tokens = message.get('token_count', 0)
            
            # Check if adding this message would exceed budget
            if total_tokens + message_tokens > self.target_window_tokens:
                print(f"DEBUG: Token budget reached. Stopping at {total_tokens} tokens")
                break
                
            filtered_messages.insert(0, message)  # Insert at beginning to maintain order
            total_tokens += message_tokens
            
        print(f"DEBUG: Selected {len(filtered_messages)} messages using {total_tokens} tokens")
        return filtered_messages, total_tokens
    
    async def count_conversation_tokens(self, messages: List[FormattedChatMessage]) -> int:
        """
        Count total tokens for a conversation (for summary generation).
        
        Args:
            messages: List of FormattedChatMessage objects
            
        Returns:
            Total token count for the entire conversation
        """
        total_tokens = 0
        for message in messages:
            tokens = await self.count_message_tokens(message)
            total_tokens += tokens
        return total_tokens
    
    async def count_text_tokens(self, text: str) -> int:
        """
        Count tokens in plain text (for summary generation).
        
        Args:
            text: Plain text string
            
        Returns:
            Token count for the text
        """
        try:
            # Count tokens using Google API
            token_response = self.client.models.count_tokens(
                model=self.model_name,
                contents=[text]
            )
            
            total_tokens = int(token_response.total_tokens)
            print(f"DEBUG: Counted {total_tokens} tokens for text")
            return total_tokens
            
        except Exception as e:
            print(f"Error counting text tokens: {e}")
            # Fallback: estimate based on text length
            estimated_tokens = max(1, len(text) // 4)
            print(f"DEBUG: Estimated {estimated_tokens} tokens from {len(text)} characters")
            return estimated_tokens
