# backend/services/chat_service.py
import asyncio
import json
import os
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

# Always use Vertex AI with ADC/service account
client = genai.Client(vertexai=True, project=project_ID, location=location)
print("Using Vertex AI (project/location)")

# Define system instruction
model_name = "gemini-2.5-flash"
system_instruction = str("Your name is Raven. You are a helpful AI assistant. You can do anything. You released on February 13, 2025."
"You're built by Victor Osunji. You have a sense of humor and can relate very well with people, even better than a therapist."
"You do everything to the best of your ability, you are a genius and you consider edge and error cases in your responses."
"Do not use emojis in your responses. You don't have to reiterate who/what you are in your responses and who made you.")

async def _prepare_contents(chat_request: ChatRequest) -> Tuple[str, List[types.Part]]:
    """Builds a plain text prompt plus a list of media Parts.

    - Text is always concatenated into a single string
    - Non text entries (image/video/audio/pdf/etc.) are converted to types.Part via URI.
    """
    print("DEBUG: Starting _prepare_contents")
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
                        print(f"Original URL: {part.text}")
                        print(f"Converted to gs:// URI: {gs_uri}")
                        
                        try:
                            # Use explicit keyword-only args expected by SDK
                            media_part = types.Part.from_uri(file_uri=gs_uri, mime_type=part.mimeType)
                            print(f"Created Part object with URI: {gs_uri}")
                            media_parts.append(media_part)
                        except Exception as inner_e:
                            print(f"ERROR creating Part from gs:// URI: {inner_e}")
                            
                            # Try with public URL instead of gs://
                            try:
                                public_url = convert_storage_path(part.text, 'public_url')
                                print(f"Trying with public URL instead: {public_url}")
                                media_part = types.Part.from_uri(file_uri=public_url, mime_type=part.mimeType)
                                print(f"Successfully created Part with public URL")
                                media_parts.append(media_part)
                            except Exception as public_url_error:
                                print(f"ERROR creating Part from public URL: {public_url_error}")
                                # Both gs:// and public URL failed, fall back to text
                                raise
                        
                    except Exception as e:
                        # Fallback: include as text reference if all Part creation fails
                        print(f"All attempts to create media Part failed: {e}")
                        clean_url = convert_storage_path(part.text, 'public_url')  # Use public URL in fallback text
                        prompt_lines.append(f"{message.role.upper()}: MEDIA({part.mimeType}): {clean_url}")

    prompt_lines.append("ASSISTANT:")
    prompt = "\n".join(prompt_lines)
    return prompt, media_parts

async def _generate_stream(contents: Union[str, List[Union[str, types.Part]]], request: Request) -> AsyncGenerator[str, None]:
    """Generates content using Gemini API with streaming for text and/or media.

    contents may be a plain string, or a list mixing the prompt string and media Parts.
    """
    print("DEBUG: Starting _generate_stream")
    
    # Log contents structure
    if isinstance(contents, str):
        print(f"DEBUG: Contents is a string: {contents[:100]}...")
    elif isinstance(contents, list):
        print(f"DEBUG: Contents is a list with {len(contents)} items")
        if len(contents) > 0 and isinstance(contents[0], str):
            print(f"DEBUG: First item is prompt text: {contents[0][:100]}...")
        
        # Log all media parts in the contents (types.Part does not expose uri)
        for i, item in enumerate(contents):
            if i > 0:  # Skip the first item which is the prompt text
                print(f"DEBUG: _generate_stream - Item {i} type: {type(item)}")
    
    try:
        # Configure Gemini with system instruction
        generation_config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            # thinking_config=types.ThinkingConfig(thinking_budget=0)
        )
        
        # Stream response from Gemini
        for chunk in client.models.generate_content_stream(
            model=model_name,
            contents=contents,
            config=generation_config,
        ):
            if await request.is_disconnected():
                print("Client disconnected")
                return
                
            # Some chunks may have empty text; skip those
            if getattr(chunk, "text", None):
                yield json.dumps({"response": chunk.text}) + "\n"
            await asyncio.sleep(0)
    except Exception as e:
        print(f"Error in Gemini streaming: {e}")
        yield json.dumps({"error": str(e)}) + "\n"

async def generate_stream(pool, chat_request: ChatRequest, request: Request, chat_id: str, user_id: str) -> AsyncGenerator[str, None]:
    """Generates a streamed response for the chat, handling both text and media with Gemini.
    Acquires its own DB connection from the shared pool to avoid using a released connection during streaming.
    """
    try:
        print("DEBUG: Starting generate_stream")
        # Prepare prompt string and any media parts
        prompt, media_parts = await _prepare_contents(chat_request)
        print(f"DEBUG: After _prepare_contents - prompt: {prompt[:100]}...")
        print(f"DEBUG: After _prepare_contents - media_parts count: {len(media_parts)}")
        response_text = ""

        # Build the contents argument: plain string for text-only, or [string, *media_parts]
        stream_contents: Union[str, List[Union[str, types.Part]]]
        if media_parts:
            stream_contents = [prompt] + media_parts
            print(f"Sending to model - Text prompt: {prompt}")
            print(f"Sending to model - Media parts count: {len(media_parts)}")
        else:
            stream_contents = prompt

        # Generate and stream the response
        async for chunk in _generate_stream(stream_contents, request):
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
                    await add_message_to_db(db, chat_id, user_id, "assistant", response_text)
            except Exception as e:
                print(f"Error saving assistant response: {e}")

    except Exception as e:
        print(f"General error in generate_stream: {e}")
        yield json.dumps({"error": str(e)}) + "\n"

async def add_message_to_db(db, chat_id, user_id, role, content, media_type=None, media_url=None):
    """Helper function to add a single message to the database"""
    message_id = str(uuid.uuid4())
    try:
        await db.execute('''
            INSERT INTO raven_messages (id, chat_id, user_id, role, content, timestamp, media_type, media_url)
            VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
        ''', message_id, chat_id, user_id, role, content or "", media_type, media_url)
        print(f"Message {message_id} inserted successfully.")
        return message_id
    except Exception as e:
        print(f"Error inserting message {message_id}: {e}")
        return None

async def add_messages_to_db(db, chat_requests, chat_id, user_id):
    """Processes and adds messages from chat requests to the database"""
    if not isinstance(chat_requests, list):
        chat_requests = [chat_requests]

    for chat_request in chat_requests:
        messages_to_add = get_last_messages(chat_request.messages)

        for message in messages_to_add:
            role = message.role
            content = ""
            
            # First process text parts to build content
            for part in message.parts:
                if part.type == 'text':
                    content += part.text if part.text else ""
            
            # Save text content if available
            if content.strip():
                await add_message_to_db(db, chat_id, user_id, role, content)
            
            # Then process media parts separately
            for part in message.parts:
                if part.type != 'text':
                    media_type = part.mimeType
                    media_url = part.text
                    if media_url:
                        # Store the clean public URL in the database
                        public_url = convert_storage_path(media_url, 'public_url')
                        await add_message_to_db(db, chat_id, user_id, role, "", media_type, public_url)

def get_last_messages(chat_messages):
    if not chat_messages:
        return []

    if len(chat_messages) >= 1:
        return chat_messages[-1:]