# backend/services/chat_service.py
import asyncio
import json
from typing import AsyncGenerator, List, Tuple, Union
from google import genai
from google.genai import types
import asyncpg
import uuid
from uuid import uuid4
from fastapi import Request
from pydantic import BaseModel, Field
import os
import vertexai
from google.cloud import aiplatform, storage
from vertexai.generative_models import GenerativeModel, Part, GenerationConfig, Tool
from ..pymodels import ChatRequest
from ..database import get_db_pool
from fastapi import Depends
import urllib.parse

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
project_name="ravenklair"
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# --- Vertex Setup ---
vertexai.init(project="klairvoyant")
model_name = "gemini-2.0-pro-exp-02-05"
system_instruction = load_text_from_file("./prompts/system_instruction.txt")
model = GenerativeModel(
    model_name,
    system_instruction=system_instruction,
)
# --- Vertex Setup ---
# --- Gemini Setup ---
async def _prepare_contents(chat_request: ChatRequest) -> Tuple[List[Part], str]:
    """Prepares the contents for the generative model."""
    files_list = []
    message_list = ""
    for message in chat_request.messages:
            for part in message.parts:
                if part.type != "text":
                    gcs_uri = part.text
                    if gcs_uri:
                        mime_type = part.mimeType
                        files_list.append(Part.from_uri(uri=part.text, mime_type=mime_type))
                else:
                    message_list += f"{message.role.upper()}: {part.text}\n"

    message_list += "ASSISTANT:"
    return files_list, message_list

async def _generate_stream_vertexai(contents: List[Part], request: Request) -> AsyncGenerator[str, None]:
    """Generates content using Vertex AI with streaming."""
    try:
        for chunk in model.generate_content(contents, stream=True):
            if await request.is_disconnected():
                print("Client disconnected")
                return
            yield json.dumps({"response": chunk.text}) + "\n"
            await asyncio.sleep(0)
    except Exception as e:
        print(f"Error in Vertex AI streaming: {e}")
        yield json.dumps({"error": str(e)}) + "\n"

async def _generate_stream_gemini(message_list: str, request: Request) -> AsyncGenerator[str, None]:
    """Generates content using Gemini API (text-only) with streaming."""
    try:
        for chunk in client.models.generate_content_stream(
            model=model_name,
            contents=[message_list],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                tools=[types.Tool(google_search=types.GoogleSearch())],
            ),
        ):
            if await request.is_disconnected():
                print("Client disconnected")
                return
            yield json.dumps({"response": chunk.text}) + "\n"
            await asyncio.sleep(0)
    except Exception as e:
        print(f"Error in Gemini Pro streaming: {e}")
        yield json.dumps({"error": str(e)}) + "\n"

async def generate_stream(db, chat_request: ChatRequest, request: Request, chat_id: str, user_id: str) -> AsyncGenerator[str, None]:
    """Generates a streamed response for the chat, handling both text and media."""
    db = await get_db_pool()
    try:
        files_list, message_list = await _prepare_contents(chat_request)

        if files_list:
            contents = files_list + [message_list]
            async for chunk in _generate_stream_vertexai(contents, request):
                yield chunk
        else:
            async for chunk in _generate_stream_gemini(message_list, request):
                yield chunk

        # Collect all chunks to build the full response text
        response_text = ""
        # Reset the generator by calling it again (This is important for correct functionality)
        if files_list:
          generator =  _generate_stream_vertexai(contents, request)
        else:
          generator =  _generate_stream_gemini(message_list, request)

        async for chunk in generator:
            try:
                # Parse the JSON and extract the text
                response_part = json.loads(chunk.strip())
                if "response" in response_part:
                  response_text += response_part["response"]
            except:
                continue #failed to parse, so just continue

        if response_text and chat_id:
            await add_custom_message_to_db(db, chat_id, user_id, "assistant", response_text)

    except Exception as e:
        print(f"General error in generate_stream: {e}")
        yield json.dumps({"error": str(e)}) + "\n"

async def add_custom_message_to_db(db, chat_id, user_id, role, content):
    message_id = str(uuid.uuid4())
    if role is not None and content is not None:
        try:
            await db.execute('''
                INSERT INTO raven_messages (id, chat_id, user_id, role, content, timestamp)
                VALUES ($1, $2, $3, $4, $5, NOW())
            ''', message_id, chat_id, user_id, role, content)
            print(f"Raven Message {message_id} inserted successfully.")
        except Exception as e:
            print(f"Error inserting Raven message {message_id}: {e}")
    else:
        print("Error: role or content missing.")

async def add_messages_to_db(db, chat_requests, chat_id, user_id):
    if not isinstance(chat_requests, list):
        chat_requests = [chat_requests]

    for chat_request in chat_requests:
        messages_to_add = get_last_messages(chat_request.messages)

        if messages_to_add:
            for message in messages_to_add:
                message_id = str(uuid.uuid4())  # Generate a NEW UUID
                role = message.role
                content = ""
                media_type = None
                media_url = None

                for part in message.parts:
                    part_text = part.text
                    part_type = part.type

                    if part_type == 'text':
                        content += part_text if part_text else ""
                    elif part_type:  # If it's NOT 'text', it's media
                        media_type = part.mimeType
                        media_url = part_text
                        # --- KEY PART: Insert EACH media item separately ---
                        if role is not None and media_url is not None:
                            try:
                                await db.execute('''
                                    INSERT INTO raven_messages (id, chat_id, user_id, role, content, timestamp, media_type, media_url)
                                    VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
                                ''', message_id, chat_id, user_id, role, "", media_type, media_url)  # content is ""
                                print(f"Media message {message_id} inserted successfully.")
                            except Exception as e:
                                print(f"Error inserting media message {message_id}: {e}")
                            message_id = str(uuid.uuid4()) # Regenerate message_id
                # Insert text content as a SEPARATE message (if any)
                if content.strip():
                    try:
                        await db.execute('''
                            INSERT INTO raven_messages (id, chat_id, user_id, role, content, timestamp, media_type, media_url)
                            VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
                        ''', message_id, chat_id, user_id, role, content, None, None)  # media_type/url are None
                        print(f"Text message {message_id} inserted successfully.")
                    except Exception as e:
                        print(f"Error inserting text message {message_id}: {e}")

def get_last_messages(chat_messages):
    if not chat_messages:
        return []

    if len(chat_messages) >= 1:
        return chat_messages[-1:]