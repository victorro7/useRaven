# backend/services/chat_service.py
import asyncio
import json
from typing import AsyncGenerator
from google import genai
from google.genai import types
import asyncpg
import uuid
from uuid import uuid4
from fastapi import Request
from pydantic import BaseModel, Field  # Import BaseModel and Field
import os
import vertexai
from google.cloud import aiplatform, storage
from vertexai.generative_models import GenerativeModel, Part, GenerationConfig, Tool
from pymodels import Message, ChatRequest  # Use relative import
from database import get_db_pool
from fastapi import Depends
import urllib.parse

# --- Gemini Setup ---
project_name="klairvoyant"
client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
# --- Gemini Setup ---

def load_text_from_file(filename):
    try:
        with open(filename, 'r') as file:
            text = file.read()
        return text
    except FileNotFoundError:
        print(f"Error: The file '{filename}' was not found.")
    except Exception as e:
        print(f"An error occurred while reading the file: {e}")

# --- Vertex Setup ---
vertexai.init(project="klairvoyant")
model_name = "gemini-2.0-pro-exp-02-05"
system_instruction = load_text_from_file("./prompts/system_instruction.txt")
model = GenerativeModel(
    model_name,
    system_instruction=system_instruction,
)
# --- Vertex Setup ---


prompt="describe the video(s). provide a catagory for the video in your response"
video_uri = str(
    "gs://raven-uploads/videos/user_2t9aAwiUsishz1NuSJi13WPH9IK/512fb03b-7550-4e3a-8ce5-99a4f8444a98-max3d.mp4"
    )
video_file_ex = Part.from_uri(
    uri=video_uri,
    mime_type="video/mp4",
)

def extract_bucket_and_file_path(gcs_url):
    try:
        parsed_url = urllib.parse.urlparse(gcs_url)
        if parsed_url.netloc != "storage.googleapis.com":
            return None  # Not a GCS URL

        path_parts = parsed_url.path.strip('/').split('/')
        if len(path_parts) < 2:
            return None  # Invalid GCS URL format

        bucket_name = path_parts[0]
        file_path = '/'.join(path_parts[1:])
        uri = f"gs://{bucket_name}/{file_path}"

        return uri #return just the uri.

    except Exception:
        return None

async def generate_stream(db, chat_request: ChatRequest, request: Request, chat_id: str, user_id: str) -> AsyncGenerator[str, None]:
    try:
        files_list = []
        contents =[]
        db = await get_db_pool() #get the pool
        message_list = ""
        for message in chat_request.messages:
            for part in message.parts:
                if part.type != "text":  # Use the .type attribute
                    gcs_uri = extract_bucket_and_file_path(part.text)  # Use part.text
                    if gcs_uri:
                        mime_type = part.type  # Use the type directly
                        if part.type == "image":
                            mime_type = "image/jpeg"
                        files_list.append(Part.from_uri(uri=gcs_uri, mime_type=mime_type))
                else:
                    message_list += f"{message.role.upper()}: {part.text}\n"  # Use part.text

        message_list += "ASSISTANT:"

        if files_list:
            contents = files_list + [message_list]

        contents.extend(message_list)

        response_text = ""
        for chunk in client.models.generate_content_stream(
            model=model_name,
            contents=[message_list],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                tools=[
                    types.Tool(
                        google_search=types.GoogleSearch()
                    ),
                ],
            ),
        ):
        # for chunk in model.generate_content(
        #     contents,
        #     stream=True
        # ):
            if await request.is_disconnected():
                print("Client disconnected")
                return

            try:
                curr_response = json.dumps(chunk.text)
                if curr_response:
                    response_text += curr_response.strip('"')

                yield json.dumps({"response": chunk.text}) + "\n"
                await asyncio.sleep(0)
            except:
                continue

        if response_text:
            await add_custom_message_to_db(db, chat_id, user_id, "assistant", response_text)

    except Exception as e:
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
            print(f"Error inserting message {message_id}: {e}")
    else:
        print("Error: role or content missing.")

# async def add_messages_to_db(db, chat_requests, chat_id, user_id):
#     if not isinstance(chat_requests, list):
#         chat_requests = [chat_requests]

#     for chat_request in chat_requests:
#         messages_to_add = get_last_messages(chat_request.messages)

#         if messages_to_add:
#             for message in messages_to_add:
#                 message_id = str(uuid.uuid4())
#                 role = message.role
#                 content = ""
#                 media_type = None  # Initialize media_type
#                 media_url = None  # Initialize media_url
#                 for part in message.parts:
#                     if part.startswith("https://storage.googleapis.com"):
#                         media_type = "image"
#                         media_url = part
#                     else:
#                         content += part #concatenate the text
#                 if role is not None and (content is not None or media_url is not None):
#                     try:
#                         await db.execute('''
#                             INSERT INTO raven_messages (id, chat_id, user_id, role, content, timestamp, media_type, media_url)
#                             VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
#                         ''', message_id, chat_id, user_id, role, content, media_type, media_url)
#                         print(f"Message {message_id} inserted successfully.")
#                     except Exception as e:
#                         print(f"Error inserting message {message_id}: {e}")
#                 else:
#                     print("missing info")
#         else:
#             print("No messages to add")

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
                print(message)
                for part in message.parts:
                    print(part)
                    part_text = part.text
                    part_type = part.type

                    if part_type == 'text':
                        content += part_text if part_text else ""
                    elif part_type:  # If it's NOT 'text', it's media
                        media_type = part_type
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