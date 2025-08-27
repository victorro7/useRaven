# backend/services/chat_service.py
import asyncio
import json
import os
import logging
import uuid
from typing import AsyncGenerator, List, Tuple, Union
from uuid import uuid4
from ..utils import convert_storage_path

import asyncpg
from dotenv import load_dotenv
from fastapi import Depends, Request
from google import genai
from google.cloud import storage
from google.genai import types
from pydantic import BaseModel, Field
from ..pymodels import ChatRequest
from .message_service import MessageHistoryService
from .token_service import TokenService
from .media_service import MediaInclusionService, MediaInclusionConfig
from .system_service import system_service

def load_text_from_file(filename):
    try:
        with open(filename, 'r') as file:
            text = file.read()
        return text
    except FileNotFoundError:
        print(f"Error: The file '{filename}' was not found.")
    except Exception as e:
        print(f"An error occurred while reading the file: {e}")

# --- Gemini Setup ---
# Load environment variables
load_dotenv()

# Get API key from environment or use a default project setup
api_key = os.getenv("GOOGLE_API_KEY")
project_ID = os.getenv("PROJECT_ID", "careful-aleph-452520-k9")
location = os.getenv("LOCATION", "us-central1")
chat_window_size = int(os.getenv("CHAT_WINDOW_SIZE", "20"))  # Default to last 20 messages

# Token-aware settings  
max_context_tokens = int(os.getenv("MAX_CONTEXT_TOKENS", "8000"))
target_window_tokens = int(os.getenv("TARGET_WINDOW_TOKENS", "6000"))

# Initialize token service
token_service = TokenService()

# Always use Vertex AI with ADC/service account
client = genai.Client(vertexai=True, project=project_ID, location=location)
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)
logger.info("Using Vertex AI (project/location)")

# Define model name via env with default
model_name = os.getenv("RAVEN_MODEL", "gemini-2.5-flash")

# System instruction will be loaded dynamically from system_service

async def _prepare_contents(chat_request: ChatRequest) -> Tuple[str, List[types.Part]]:
    """Builds a plain text prompt plus a list of media Parts.

    - Text is always concatenated into a single string
    - Non text entries (image/video/audio/pdf/etc.) are converted to types.Part via URI.
    """
    logger.debug("Starting _prepare_contents")
    prompt_lines: List[str] = []
    media_parts: List[types.Part] = []

    for message in chat_request.messages:
        for part in message.parts:
            if part.type == "text":
                if part.text and part.text.strip():
                    prompt_lines.append(f"{message.role.upper()}: {part.text}")
            else:
                if part.text:
                    try:
                        # Convert to gsutil URI format (gs://) for model consumption
                        gs_uri = convert_storage_path(part.text, 'gs_uri')
                        logger.debug("Converted media URL to gs:// URI")
                        
                        try:
                            # Use explicit keyword-only args expected by SDK
                            media_part = types.Part.from_uri(file_uri=gs_uri, mime_type=part.mimeType)
                            logger.debug("Created Part object from gs:// URI")
                            media_parts.append(media_part)
                        except Exception as inner_e:
                            logger.warning(f"Part.from_uri(gs://) failed: {inner_e}")
                            
                            # Try with public URL instead of gs://
                            try:
                                public_url = convert_storage_path(part.text, 'public_url')
                                logger.debug("Retrying Part.from_uri with public URL")
                                media_part = types.Part.from_uri(file_uri=public_url, mime_type=part.mimeType)
                                logger.debug("Created Part from public URL")
                                media_parts.append(media_part)
                            except Exception as public_url_error:
                                logger.error(f"Part.from_uri(public_url) failed: {public_url_error}")
                                # Both gs:// and public URL failed, fall back to text
                                raise
                        
                    except Exception as e:
                        # Fallback: include as text reference if all Part creation fails
                        logger.error(f"All attempts to create media Part failed: {e}")
                        clean_url = convert_storage_path(part.text, 'public_url')  # Use public URL in fallback text
                        prompt_lines.append(f"{message.role.upper()}: MEDIA({part.mimeType}): {clean_url}")

    prompt_lines.append("ASSISTANT:")
    prompt = "\n".join(prompt_lines)
    return prompt, media_parts

async def _generate_stream(contents: Union[str, List[Union[str, types.Part]]], request: Request, personalized_system: str = None) -> AsyncGenerator[str, None]:
    """Generates content using Gemini API with streaming for text and/or media.

    contents may be a plain string, or a list mixing the prompt string and media Parts.
    personalized_system will override the default system instruction if provided.
    """
    logger.debug("Starting _generate_stream")
    
    # Log contents structure
    if isinstance(contents, str):
        logger.debug("Contents is a string")
    elif isinstance(contents, list):
        logger.debug(f"Contents is a list with {len(contents)} items")
        if len(contents) > 0 and isinstance(contents[0], str):
            logger.debug("First item is prompt text")
        
        # Log all media parts in the contents (types.Part does not expose uri)
        for i, item in enumerate(contents):
            if i > 0:  # Skip the first item which is the prompt text
                logger.debug(f"_generate_stream item type: {type(item)}")
    
    try:
        # Configure Gemini with personalized system instruction if provided
        generation_config = types.GenerateContentConfig(
            system_instruction=personalized_system or system_instruction,
            # thinking_config=types.ThinkingConfig(thinking_budget=0)
        )
        
        # Stream response from Gemini
        for chunk in client.models.generate_content_stream(
            model=model_name,
            contents=contents,
            config=generation_config,
        ):
            if await request.is_disconnected():
                logger.info("Client disconnected")
                return
                
            # Some chunks may have empty text; skip those
            if getattr(chunk, "text", None):
                yield json.dumps({"response": chunk.text}) + "\n"
            await asyncio.sleep(0)
    except Exception as e:
        logger.error(f"Error in Gemini streaming: {e}")
        yield json.dumps({"error": str(e)}) + "\n"

async def generate_stream(pool, chat_request: ChatRequest, request: Request, chat_id: str, user_id: str) -> AsyncGenerator[str, None]:
    """Generates a streamed response for the chat, handling both text and media with Gemini.
    Uses server-side windowing to include the last N messages from database plus the current user message.
    Enriches the system prompt with user information.
    """
    try:
        logger.debug("Starting generate_stream with server-side windowing")
        
        # Get a database connection for fetching history
        async with pool.acquire() as db:
            # Fetch user's name or other profile info
            user_info = await db.fetchrow("""
                SELECT email, first_name, last_name FROM users_raven WHERE id = $1
            """, user_id)
            
            # Get system instruction from service (loads from GCS or local fallback)
            base_instruction = await system_service.get_system_instruction()
            
            # Personalize the instruction for this user
            personalized_system = system_service.personalize_for_user(base_instruction, user_info)
            
            # Use summary-aware message retrieval (falls back to token-aware windowing)
            logger.debug(f"Fetching history with summary support. budget={target_window_tokens}")
            history_messages, history_tokens = await MessageHistoryService.get_messages_with_summary(
                db, chat_id, user_id, max_tokens=target_window_tokens
            )
            logger.debug(f"History fetched messages={len(history_messages)} tokens={history_tokens}")
            
            # Extract ONLY the new user message (ignore any history client sent)
            logger.debug(f"Client sent messages={len(chat_request.messages)}")
            new_user_messages = []
            if chat_request.messages:
                # Get the very last message from client - this should be the new one
                latest_client_message = chat_request.messages[-1]
                logger.debug(f"Latest client message role={latest_client_message.role} parts={len(latest_client_message.parts)}")
                
                # Only include if it's a user message (not assistant)
                if latest_client_message.role == "user":
                    new_user_messages = [latest_client_message]
                    logger.debug("Extracted new user message")
                else:
                    logger.debug("Skipping non-user message from client")
            
            logger.debug(f"New user messages count={len(new_user_messages)}")
            
            # Combine history with ONLY the new message
            all_messages = history_messages + new_user_messages
            logger.debug(f"Total context messages={len(all_messages)} history_tokens={history_tokens}")
            
            # Intelligent media inclusion: decide allowed URLs first
            media_selector = MediaInclusionService(MediaInclusionConfig())
            latest_user_msg = new_user_messages[0] if new_user_messages else None
            allowed_urls = media_selector.get_allowed_media_urls(latest_user_msg, history_messages)

            # Convert allowed URLs to gs:// for matching in formatter
            allowed_gs = {convert_storage_path(u, 'gs_uri') for u in allowed_urls}

            # Format the conversation for the model, passing allowed URIs so formatter can skip others
            prompt, media_parts = await MessageHistoryService.format_conversation_for_model(all_messages, allowed_gs_uris=allowed_gs)
            logger.debug(f"Prompt chars={len(prompt)} media_parts={len(media_parts)}")
            
        response_text = ""

        # Build the contents argument: plain string for text-only, or [string, *media_parts]
        stream_contents: Union[str, List[Union[str, types.Part]]]
        if media_parts:
            stream_contents = [prompt] + media_parts
            logger.info(f"Sending to model media_parts={len(media_parts)}")
        else:
            stream_contents = prompt

        # Generate and stream the response
        async for chunk in _generate_stream(stream_contents, request, personalized_system):
            yield chunk
            try:
                response_part = json.loads(chunk.strip())
                if "response" in response_part:
                    response_text += response_part["response"]
            except:
                continue

        # Store the response text to DB using a fresh connection from the pool
        if response_text and chat_id:
            try:
                async with pool.acquire() as db:
                    # Count tokens for assistant response
                    from ..pymodels import FormattedChatMessage, ChatMessagePart
                    assistant_message = FormattedChatMessage(
                        role="assistant", 
                        parts=[ChatMessagePart(text=response_text, type="text", mimeType=None)]
                    )
                    response_tokens = await token_service.count_message_tokens(assistant_message)
                    logger.debug(f"Assistant response tokens={response_tokens}")
                    
                    await add_message_to_db(db, chat_id, user_id, "assistant", response_text, token_count=response_tokens)
            except Exception as e:
                logger.error(f"Error saving assistant response: {e}")

    except Exception as e:
        logger.error(f"General error in generate_stream: {e}")
        yield json.dumps({"error": str(e)}) + "\n"

async def add_message_to_db(db, chat_id, user_id, role, content, media_type=None, media_url=None, token_count=0):
    """Helper function to add a single message to the database with token count"""
    message_id = str(uuid.uuid4())
    try:
        await db.execute('''
            INSERT INTO raven_messages (id, chat_id, user_id, role, content, timestamp, media_type, media_url, token_count)
            VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8)
        ''', message_id, chat_id, user_id, role, content or "", media_type, media_url, token_count)
        logger.debug(f"Message {message_id} inserted with {token_count} tokens")
        return message_id
    except Exception as e:
        logger.error(f"Error inserting message {message_id}: {e}")
        return None

async def add_messages_to_db(db, chat_requests, chat_id, user_id):
    """Processes and adds messages from chat requests to the database with token counting"""
    if not isinstance(chat_requests, list):
        chat_requests = [chat_requests]

    for chat_request in chat_requests:
        # Only process the last message from the request (the new one)
        messages_to_add = [chat_request.messages[-1]] if chat_request.messages else []

        for message in messages_to_add:
            role = message.role
            
            # Count tokens for the entire message (including media)
            try:
                message_tokens = await token_service.count_message_tokens(message)
                logger.debug(f"Calculated {message_tokens} tokens for {role} message")
            except Exception as e:
                logger.warning(f"Error counting tokens for message: {e}")
                message_tokens = 0
            
            # Process text content
            content = ""
            for part in message.parts:
                if part.type == 'text':
                    content += part.text if part.text else ""
            
            # Save text content if available
            if content.strip():
                await add_message_to_db(db, chat_id, user_id, role, content, token_count=message_tokens)
            
            # Process media parts separately (tokens already counted above)
            for part in message.parts:
                if part.type != 'text':
                    media_type = part.mimeType
                    media_url = part.text
                    if media_url:
                        # Store gs:// URI in the database for server-side processing
                        gs_uri = convert_storage_path(media_url, 'gs_uri')
                        # Only store tokens for media-only messages (when no text content)
                        media_tokens = message_tokens if not content.strip() else 0
                        await add_message_to_db(db, chat_id, user_id, role, "", media_type, gs_uri, token_count=media_tokens)

def get_last_messages(chat_messages):
    if not chat_messages:
        return []

    if len(chat_messages) >= 1:
        return chat_messages[-1:]