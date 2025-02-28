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
from pydantic import BaseModel, Field
import os
from pymodels import Message, ChatRequest
from database import get_db_pool
from fastapi import Depends
import vertexai
from google.cloud import aiplatform, storage
from vertexai.generative_models import GenerativeModel, Part, GenerationConfig, Tool

# --- Gemini Setup ---
client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
# --- Gemini Setup ---

prompt="describe the video(s). provide a catagory for the video in your response"
video_uri = str("gs://raven-uploads/videos/user_2t9aAwiUsishz1NuSJi13WPH9IK/4a393259-7ae6-4a3d-b732-89b38c6186f2-8CF92F91-E144-4256-AE56-13A232499693 Copy.MOV")
mime_type=str("video/mp4")
system_instruction=str("Your name is Raven. You are a helpful AI assistant. You can do anything. You released on February 13, 2025. You're built by Victor Osunji. You have a sense of humor and can relate very well with people, even better than a therapist. You do everything to the best of your ability, you are a genius and you consider edge and error cases in your responses. Do not use emojis in your responses. You don't have to reiterate who/what you are in you responses.")
model_name = "gemini-2.0-pro-exp-02-05"

vertexai.init(project="klairvoyant")
model = GenerativeModel(model_name)
prompt = prompt
video_file_1 = Part.from_uri(
    uri=video_uri,
    mime_type=mime_type,
)
# contents = [video_file_1]

def get_multiple_gcs_file_info(file_info_list):
    """
    Retrieves the URI and MIME type of multiple files in GCS.

    Args:
        file_info_list: A list of dictionaries, where each dictionary represents a file
                         and contains 'bucket_name' and 'file_path' keys.

    Returns:
        A list of dictionaries, where each dictionary contains 'uri', 'mime_type',
        'bucket_name', and 'file_path' keys. If a file is not found or an error occurs,
        'uri' and 'mime_type' will be None.
    """
    results = []
    try:
        storage_client = storage.Client()

        for file_info in file_info_list:
            bucket_name = file_info.get("bucket_name")
            file_path = file_info.get("file_path")

            if not bucket_name or not file_path:
                results.append({
                    "bucket_name": bucket_name,
                    "file_path": file_path,
                    "uri": None,
                    "mime_type": None,
                    "error": "Missing bucket_name or file_path"
                })
                continue

            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(file_path)

            if blob.exists():
                uri = f"gs://{bucket_name}/{file_path}"
                mime_type = blob.content_type
                results.append({
                    "bucket_name": bucket_name,
                    "file_path": file_path,
                    "uri": uri,
                    "mime_type": mime_type,
                    "error": None
                })
            else:
                results.append({
                    "bucket_name": bucket_name,
                    "file_path": file_path,
                    "uri": None,
                    "mime_type": None,
                    "error": "File not found"
                })

    except Exception as e:
        results.append({
            "bucket_name": None,
            "file_path": None,
            "uri": None,
            "mime_type": None,
            "error": str(e)
        })

    return results


async def generate_stream(db, chat_request: ChatRequest, request: Request, chat_id: str, user_id: str) -> AsyncGenerator[str, None]:
    try:
        files_list = []
        contents =[]
        db = await get_db_pool() #get the pool

        model_name = "gemini-2.0-pro-exp-02-05"
        message_list = ""
        for message in chat_request.messages:
            for part in message.parts:
                # message_list += f"{message.role.upper()}: {part}\n"
                if part.startswith("gs://"):  # Check if the part is a URL
                    files_list.append(part)
                    continue
                    # message_list += f"{message.role.upper()}: ![Image]({part})\n"  # Correctly format as Markdown
                else:
                    message_list += f"{message.role.upper()}: {part}\n"
        message_list += "ASSISTANT:"

        if files_list:
            contents.append(files_list)

        contents.append(message_list)
        if files_list:
            response = model.generate_content(
                contents
            )

        response_text = ""
        for chunk in client.models.generate_content_stream(
            model=model_name,
            contents=[message_list, f"reponse {response}"],
            config=types.GenerateContentConfig(
                system_instruction="Your name is Raven. You are a helpful AI assistant. You can do anything. You released on February 13, 2025. You're built by Victor Osunji. You have a sense of humor and can relate very well with people, even better than a therapist. You do everything to the best of your ability, you are a genius and you consider edge and error cases in your responses. Do not use emojis in your responses. You don't have to reiterate who/what you are in you responses.",
                tools=[
                    types.Tool(
                        google_search=types.GoogleSearch()
                    ),
                ],
            ),
        ):
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
            print(f"Message {message_id} inserted successfully.")
        except Exception as e:
            print(f"Error inserting message {message_id}: {e}")
    else:
        print("Error: role or content missing.")

async def add_messages_to_db(db, chat_requests, chat_id, user_id):
    if not isinstance(chat_requests, list):
        chat_requests = [chat_requests]

    for chat_request in chat_requests:
        messages_to_add = get_last_messages(chat_request.messages)
        print(messages_to_add)

        if messages_to_add:
            for message in messages_to_add:
                message_id = str(uuid.uuid4())
                role = message.role
                content = ""
                media_type = None  # Initialize media_type
                media_url = None  # Initialize media_url
                for part in message.parts:
                    if part.startswith("http"):
                        media_type = "image"  # Or "video", etc., based on your logic
                        media_url = part
                    else:
                        content += part #concatenate the text
                if role is not None and (content is not None or media_url is not None):
                    try:
                        # async with db.acquire() as conn: # Acquire a connection from the pool
                        await db.execute('''
                            INSERT INTO raven_messages (id, chat_id, user_id, role, content, timestamp, media_type, media_url)
                            VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
                        ''', message_id, chat_id, user_id, role, content, media_type, media_url)
                        print(f"Message {message_id} inserted successfully.")
                    except Exception as e:
                        print(f"Error inserting message {message_id}: {e}")
                else:
                    print("missing info")
    else:
        print("No messages to add")

def get_last_messages(chat_messages):
    if not chat_messages:
        return []

    if len(chat_messages) >= 1:
        return chat_messages[-1:]
    