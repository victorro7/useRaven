# backend/services/summary_service.py
"""
Summary Service for managing rolling conversation summaries.

Handles the generation, storage, and retrieval of conversation summaries
to optimize token usage in long conversations.
"""

import os
import logging
import asyncpg
from typing import Optional, Tuple, List
from datetime import datetime
from google import genai
from google.genai import types

from ..pymodels import FormattedChatMessage
from .token_service import TokenService


class SummaryConfig:
    """Configuration class for summary generation settings."""
    
    def __init__(self):
        # Token thresholds  
        self.trigger_total_tokens = int(os.getenv("SUMMARY_TRIGGER_TOKENS", "3500"))  # Lowered for testing
        self.target_summary_tokens = int(os.getenv("SUMMARY_TARGET_TOKENS", "400"))
        self.max_summary_tokens = int(os.getenv("SUMMARY_MAX_TOKENS", "600"))
        
        # Trigger conditions
        self.min_messages_to_summarize = int(os.getenv("SUMMARY_MIN_MESSAGES", "10"))
        self.keep_recent_messages = int(os.getenv("SUMMARY_KEEP_RECENT", "5"))
        
        # Summary generation
        self.summary_temperature = float(os.getenv("SUMMARY_TEMPERATURE", "0.3"))
        self.summary_model = os.getenv("SUMMARY_MODEL", "gemini-2.0-flash")


class SummaryService:
    """
    Service for managing conversation summaries to optimize token usage.
    
    Responsibilities:
    - Detect when conversations need summarization
    - Generate concise summaries of older messages
    - Store and retrieve summaries from database
    - Integrate summaries with message history
    """
    
    def __init__(self, token_service: TokenService = None):
        self.config = SummaryConfig()
        self.token_service = token_service or TokenService()
        
        # Initialize GenAI client (reuse existing configuration)
        project_id = os.getenv("PROJECT_ID", "careful-aleph-452520-k9")
        location = os.getenv("LOCATION", "us-central1")
        self.client = genai.Client(vertexai=True, project=project_id, location=location)
        
        self.logger = logging.getLogger(__name__)
        self.logger.debug(f"SummaryService trigger={self.config.trigger_total_tokens} tokens")
    
    async def should_create_summary(
        self, 
        db: asyncpg.Connection, 
        chat_id: str, 
        user_id: str
    ) -> Tuple[bool, int]:
        """
        Determine if a conversation needs summarization.
        
        Returns:
            Tuple of (should_summarize, total_tokens)
        """
        try:
            # Get total tokens for this chat
            query = """
                SELECT 
                    COUNT(*) as message_count,
                    COALESCE(SUM(token_count), 0) as total_tokens
                FROM raven_messages 
                WHERE chat_id = $1
            """
            row = await db.fetchrow(query, chat_id)
            
            message_count = int(row['message_count']) if row['message_count'] is not None else 0
            total_tokens = int(row['total_tokens']) if row['total_tokens'] is not None else 0
            
            self.logger.debug(f"chat_id={chat_id} messages={message_count} tokens={total_tokens}")
            
            # Check if we need summarization
            should_summarize = (
                total_tokens >= self.config.trigger_total_tokens and
                message_count >= self.config.min_messages_to_summarize
            )
            
            # Check if summary already exists
            if should_summarize:
                existing_summary = await self._get_latest_summary(db, chat_id, user_id)
                if existing_summary:
                    self.logger.debug("Existing summary found; checking if update needed")
                    # Get tokens since last summary
                    tokens_since_summary = await self._get_tokens_since_summary(
                        db, chat_id, existing_summary['end_message_timestamp']
                    )
                    trigger_threshold = self.config.trigger_total_tokens // 2
                    should_summarize = tokens_since_summary >= trigger_threshold
            
            return should_summarize, total_tokens
            
        except Exception as e:
            self.logger.error(f"Failed to check summary need: {e}")
            return False, 0
    
    async def generate_summary(
        self,
        db: asyncpg.Connection,
        chat_id: str,
        user_id: str,
        messages_to_summarize: List[FormattedChatMessage]
    ) -> Optional[str]:
        """
        Generate a conversation summary using the GenAI API.
        
        Args:
            db: Database connection
            chat_id: Chat identifier
            user_id: User identifier  
            messages_to_summarize: List of messages to include in summary
            
        Returns:
            Generated summary text or None if failed
        """
        try:
            self.logger.debug(f"Generating summary for messages={len(messages_to_summarize)}")
            
            # Build conversation text for summarization
            conversation_text = self._format_messages_for_summary(messages_to_summarize)
            
            # Create summary prompt
            summary_prompt = self._build_summary_prompt(conversation_text)
            
            # Generate summary using GenAI
            response = self.client.models.generate_content(
                model=self.config.summary_model,
                contents=[summary_prompt],
                config=types.GenerateContentConfig(
                    temperature=self.config.summary_temperature,
                    max_output_tokens=self.config.max_summary_tokens,
                )
            )
            
            summary_text = response.text.strip()
            
            # Count tokens in the generated summary
            summary_tokens = await self.token_service.count_text_tokens(summary_text)
            
            self.logger.debug(f"Generated summary tokens={summary_tokens}")
            
            return summary_text
            
        except Exception as e:
            self.logger.error(f"Failed to generate summary: {e}")
            return None
    
    async def save_summary(
        self,
        db: asyncpg.Connection,
        chat_id: str,
        user_id: str,
        summary_text: str,
        start_timestamp: datetime,
        end_timestamp: datetime,
        messages_count: int
    ) -> Optional[str]:
        """Save a generated summary to the database."""
        try:
            # Count tokens in summary
            summary_tokens_result = await self.token_service.count_text_tokens(summary_text)
            summary_tokens = int(summary_tokens_result) if summary_tokens_result is not None else 0
            
            # Get next version number
            version_query = """
                SELECT COALESCE(MAX(version), 0) + 1 as next_version
                FROM chat_summaries WHERE chat_id = $1
            """
            next_version_result = await db.fetchval(version_query, chat_id)
            next_version = int(next_version_result) if next_version_result is not None else 1
            
            # Insert new summary
            insert_query = """
                INSERT INTO chat_summaries (
                    chat_id, user_id, summary_text, summary_tokens,
                    start_message_timestamp, end_message_timestamp,
                    messages_summarized, version
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            """
            
            summary_id = await db.fetchval(
                insert_query,
                chat_id, user_id, summary_text, summary_tokens,
                start_timestamp, end_timestamp, messages_count, next_version
            )
            
            self.logger.info(f"Saved summary id={summary_id} version={next_version}")
            return summary_id
            
        except Exception as e:
            self.logger.error(f"Failed to save summary: {e}")
            return None
    
    async def get_summary_with_recent_messages(
        self,
        db: asyncpg.Connection,
        chat_id: str,
        user_id: str,
        max_tokens: int
    ) -> Tuple[Optional[str], List[dict], int]:
        """
        Get conversation summary combined with recent messages.
        
        Returns:
            Tuple of (summary_text, recent_messages, total_tokens_used)
        """
        try:
            # Get latest summary
            summary = await self._get_latest_summary(db, chat_id, user_id)
            
            if not summary:
                self.logger.debug(f"No summary found for chat {chat_id}")
                return None, [], 0
            
            summary_tokens = int(summary['summary_tokens']) if summary['summary_tokens'] is not None else 0
            remaining_tokens = max_tokens - summary_tokens
            
            self.logger.debug(f"Summary tokens={summary_tokens} remaining={remaining_tokens}")
            
            if remaining_tokens <= 0:
                self.logger.warning("Summary exceeds token budget")
                return summary['summary_text'], [], summary_tokens
            
            # Get recent messages since summary
            recent_messages_query = """
                SELECT id, role, content, media_type, media_url, token_count,
                       EXTRACT(EPOCH FROM timestamp) as timestamp
                FROM raven_messages
                WHERE chat_id = $1 AND timestamp > $2
                ORDER BY timestamp ASC
            """
            
            recent_rows = await db.fetch(
                recent_messages_query, 
                chat_id, 
                summary['end_message_timestamp']
            )
            
            # Filter recent messages by remaining token budget
            selected_messages = []
            tokens_used = summary_tokens
            
            for row in recent_rows:
                message_tokens = int(row['token_count']) if row['token_count'] is not None else 0
                if tokens_used + message_tokens <= max_tokens:
                    selected_messages.append(dict(row))
                    tokens_used += message_tokens
                else:
                    break
            
            self.logger.debug(f"Combined summary + recent messages count={len(selected_messages)} total_tokens={tokens_used}")
            
            return summary['summary_text'], selected_messages, tokens_used
            
        except Exception as e:
            self.logger.error(f"Failed to get summary with recent messages: {e}")
            return None, [], 0
    
    async def _get_latest_summary(
        self, 
        db: asyncpg.Connection, 
        chat_id: str, 
        user_id: str
    ) -> Optional[dict]:
        """Get the most recent summary for a chat."""
        query = """
            SELECT * FROM chat_summaries
            WHERE chat_id = $1 AND user_id = $2
            ORDER BY version DESC
            LIMIT 1
        """
        row = await db.fetchrow(query, chat_id, user_id)
        return dict(row) if row else None
    
    async def _get_tokens_since_summary(
        self, 
        db: asyncpg.Connection, 
        chat_id: str, 
        since_timestamp: datetime
    ) -> int:
        """Get total tokens of messages since the last summary."""
        query = """
            SELECT COALESCE(SUM(token_count), 0) as tokens
            FROM raven_messages
            WHERE chat_id = $1 AND timestamp > $2
        """
        result = await db.fetchval(query, chat_id, since_timestamp)
        return int(result) if result is not None else 0
    
    def _format_messages_for_summary(self, messages: List[FormattedChatMessage]) -> str:
        """Format messages into text suitable for summarization."""
        formatted_lines = []
        
        for message in messages:
            role = message.role.upper()
            content_parts = []
            
            for part in message.parts:
                if part.type == "text" and part.text:
                    content_parts.append(part.text)
                elif part.type in ["image", "video", "audio", "application"]:
                    content_parts.append(f"[{part.type.upper()}: {part.mimeType}]")
            
            if content_parts:
                formatted_lines.append(f"{role}: {' '.join(content_parts)}")
        
        return "\n".join(formatted_lines)
    
    def _build_summary_prompt(self, conversation_text: str) -> str:
        """Build the prompt for summary generation."""
        return f"""Please create a concise summary of this conversation. Focus on:
1. Key topics discussed
2. Important decisions or conclusions
3. User's main questions and concerns
4. Any specific requests or tasks mentioned
5. Context that would be helpful for future conversation

Keep the summary between {self.config.target_summary_tokens//4} and {self.config.max_summary_tokens//4} words.

Conversation to summarize:
{conversation_text}

Summary:"""


