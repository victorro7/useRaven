# backend/services/message_service.py
from typing import List, Optional, Tuple
import asyncpg
from ..pymodels import ChatMessage, ChatMessagePart, FormattedChatMessage
import logging
logger = logging.getLogger(__name__)


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

            # Fetch recent messages with their media and token counts (excluding latest N if specified)
            query = """
                SELECT id, role, content, media_type, media_url, token_count,
                       EXTRACT(EPOCH FROM timestamp) as timestamp
                FROM raven_messages
                WHERE chat_id = $1
                ORDER BY timestamp DESC
                LIMIT $2 OFFSET $3
            """
            logger.debug(f"MessageHistoryService fetch limit={limit} exclude_latest={exclude_latest}")
            rows = await db.fetch(query, chat_id, limit, exclude_latest)
            logger.debug(f"MessageHistoryService retrieved rows={len(rows)}")
            
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
            logger.error(f"Error retrieving message history: {e}")
            return []

    @staticmethod
    async def get_recent_messages_by_tokens(
        db: asyncpg.Connection, 
        chat_id: str, 
        user_id: str, 
        max_tokens: int = 6000,
        exclude_latest: int = 0
    ) -> Tuple[List[FormattedChatMessage], int]:
        """
        Retrieve recent messages that fit within a token budget.
        
        Args:
            db: Database connection
            chat_id: Chat identifier
            user_id: User identifier (for security)
            max_tokens: Maximum token budget
            exclude_latest: Number of most recent messages to exclude
            
        Returns:
            Tuple of (messages, total_tokens_used)
        """
        try:
            # First verify the chat belongs to the user
            chat_query = "SELECT id FROM raven_chats WHERE id = $1 AND user_id = $2"
            chat = await db.fetchrow(chat_query, chat_id, user_id)
            if not chat:
                return [], 0

            # Fetch messages ordered by timestamp (newest first) with token counts
            query = """
                SELECT id, role, content, media_type, media_url, token_count,
                       EXTRACT(EPOCH FROM timestamp) as timestamp
                FROM raven_messages
                WHERE chat_id = $1
                ORDER BY timestamp DESC
                OFFSET $2
            """
            logger.debug(f"Token-aware fetch max_tokens={max_tokens} exclude_latest={exclude_latest}")
            rows = await db.fetch(query, chat_id, exclude_latest)
            logger.debug(f"Token-aware fetch rows={len(rows)}")
            
            # Filter by token budget, starting from most recent
            selected_rows = []
            total_tokens = 0
            
            for row in rows:
                row_tokens = row['token_count'] or 0
                
                if total_tokens + row_tokens > max_tokens:
                    logger.debug(f"Token budget exceeded at tokens={total_tokens}")
                    break
                    
                selected_rows.append(row)
                total_tokens += row_tokens
                
            logger.debug(f"Token-aware fetch selected_rows={len(selected_rows)} tokens_used={total_tokens}")
            
            # Group selected messages by role and timestamp to reconstruct conversation turns
            messages = []
            current_message = None
            
            # Process in reverse order to get chronological flow (oldest first)
            for row in reversed(selected_rows):
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
            
            logger.debug(f"Token-aware reconstruct messages={len(messages)} tokens={total_tokens}")
            return messages, total_tokens
            
        except Exception as e:
            logger.error(f"Error retrieving token-aware message history: {e}")
            return [], 0

    @staticmethod 
    async def get_messages_with_summary(
        db: asyncpg.Connection,
        chat_id: str,
        user_id: str,
        max_tokens: int = 6000
    ) -> Tuple[List[FormattedChatMessage], int]:
        """
        Get conversation context using summary + recent messages when available.
        Falls back to token-aware windowing if no summary exists.
        
        Returns:
            Tuple of (messages_for_context, total_tokens_used)
        """
        try:
            # Import here to avoid circular imports
            from .summary_service import SummaryService
            from .token_service import TokenService
            
            token_service = TokenService()
            summary_service = SummaryService(token_service)
            
            # Check if we should create a summary first
            should_summarize, total_tokens = await summary_service.should_create_summary(
                db, chat_id, user_id
            )
            
            if should_summarize:
                logger.debug(f"Chat needs summarization chat_id={chat_id} tokens={total_tokens}")
                await MessageHistoryService._create_summary_if_needed(
                    db, chat_id, user_id, summary_service
                )
            
            # Try to get summary + recent messages
            summary_text, recent_messages, tokens_used = await summary_service.get_summary_with_recent_messages(
                db, chat_id, user_id, max_tokens
            )
            
            if summary_text:
                logger.debug(f"Using summary + recent messages count={len(recent_messages)} tokens={tokens_used}")
                
                # Convert recent messages to FormattedChatMessage objects
                formatted_messages = []
                
                # Add summary as a system message for context
                from ..pymodels import ChatMessagePart
                summary_message = FormattedChatMessage(
                    role="system",
                    parts=[ChatMessagePart(text=f"Previous conversation summary: {summary_text}", type="text", mimeType=None)]
                )
                formatted_messages.append(summary_message)
                
                # Process recent messages
                formatted_messages.extend(
                    await MessageHistoryService._convert_db_rows_to_messages(recent_messages)
                )
                
                return formatted_messages, tokens_used
            else:
                logger.debug("No summary available; falling back to token-aware windowing")
                # Fallback to existing token-aware method
                return await MessageHistoryService.get_recent_messages_by_tokens(
                    db, chat_id, user_id, max_tokens, exclude_latest=0
                )
                
        except Exception as e:
            logger.error(f"Failed to get messages with summary: {e}")
            # Fallback to existing method
            return await MessageHistoryService.get_recent_messages_by_tokens(
                db, chat_id, user_id, max_tokens, exclude_latest=0
            )
    
    @staticmethod
    async def _create_summary_if_needed(
        db: asyncpg.Connection,
        chat_id: str,
        user_id: str,
        summary_service
    ) -> None:
        """Create a summary if conditions are met."""
        try:
            # Get messages to summarize (exclude recent ones)
            messages_query = """
                SELECT id, role, content, media_type, media_url, token_count,
                       EXTRACT(EPOCH FROM timestamp) as timestamp
                FROM raven_messages
                WHERE chat_id = $1
                ORDER BY timestamp ASC
                OFFSET 0 LIMIT (
                    SELECT COUNT(*) - $2 FROM raven_messages WHERE chat_id = $1
                )
            """
            
            rows = await db.fetch(messages_query, chat_id, summary_service.config.keep_recent_messages)
            
            if len(rows) < summary_service.config.min_messages_to_summarize:
                logger.debug(f"Not enough messages to summarize count={len(rows)}")
                return
            
            # Convert to FormattedChatMessage objects
            messages_to_summarize = await MessageHistoryService._convert_db_rows_to_messages(rows)
            
            if not messages_to_summarize:
                return
            
            # Generate summary
            summary_text = await summary_service.generate_summary(
                db, chat_id, user_id, messages_to_summarize
            )
            
            if summary_text:
                # Get timestamp range
                start_timestamp = rows[0]['timestamp']
                end_timestamp = rows[-1]['timestamp']
                
                # Convert epoch timestamps (which may be Decimal) to datetime
                from datetime import datetime
                try:
                    start_dt = datetime.fromtimestamp(float(start_timestamp))
                except Exception:
                    start_dt = datetime.utcnow()
                try:
                    end_dt = datetime.fromtimestamp(float(end_timestamp))
                except Exception:
                    end_dt = datetime.utcnow()
                
                # Save summary
                await summary_service.save_summary(
                    db, chat_id, user_id, summary_text,
                    start_dt, end_dt, len(rows)
                )
                
                logger.debug(f"Created summary for messages={len(rows)}")
            
        except Exception as e:
            logger.error(f"Failed to create summary: {e}")
    
    @staticmethod
    async def _convert_db_rows_to_messages(rows: List[dict]) -> List[FormattedChatMessage]:
        """Convert database rows to FormattedChatMessage objects."""
        messages = []
        current_message = None
        
        for row in rows:
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
                from ..pymodels import ChatMessagePart
                current_message.parts.append(
                    ChatMessagePart(text=content.strip(), type="text", mimeType=None)
                )
            
            # Add media content if present
            if media_type and media_url:
                from ..pymodels import ChatMessagePart
                current_message.parts.append(
                    ChatMessagePart(text=media_url, type=media_type.split('/')[0], mimeType=media_type)
                )
        
        # Add the last message
        if current_message is not None:
            messages.append(current_message)
        
        return messages

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
                            logger.debug("Adding media to history - converted to gs://")
                            
                            # Create media part with retry for upload timing
                            logger.debug(f"Creating Part for {part.type}")
                            
                            # Retry mechanism for videos (more prone to timing issues)
                            max_retries = 3 if part.type == "video" else 1
                            retry_delay = 1.0  # Start with 1 second
                            
                            for attempt in range(max_retries):
                                try:
                                    if attempt > 0:
                                        logger.debug(f"Retry attempt {attempt + 1}/{max_retries} for {part.type}")
                                        import time
                                        time.sleep(retry_delay)
                                        retry_delay *= 2  # Exponential backoff
                                    
                                    media_part = types.Part.from_uri(file_uri=gs_uri, mime_type=part.mimeType)
                                    logger.debug(f"Created Part for {part.type} (attempt {attempt + 1})")
                                    media_parts.append(media_part)
                                    break  # Success, exit retry loop
                                    
                                except Exception as part_error:
                                    logger.warning(f"Attempt {attempt + 1} failed for {part.type}: {part_error}")
                                    
                                    if attempt == max_retries - 1:  # Last attempt failed
                                        logger.error(f"All {max_retries} attempts failed for {part.type}")
                                        # Add as text fallback
                                        clean_url = convert_storage_path(part.text, 'public_url')
                                        prompt_lines.append(f"{message.role.upper()}: {part.type.upper()}({part.mimeType}): {clean_url}")
                                        continue
                        except Exception as e:
                            # Fallback: include as text reference if Part creation fails
                            logger.error(f"Failed to create media Part for history: {e}")
                            clean_url = convert_storage_path(part.text, 'public_url')
                            prompt_lines.append(f"{message.role.upper()}: MEDIA({part.mimeType}): {clean_url}")
        
        prompt_lines.append("ASSISTANT:")
        prompt = "\n".join(prompt_lines)
        return prompt, media_parts
