# backend/routers/raven.py
from httpx import request
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from ..pymodels import PresignedUrlRequest, PresignedUrlResponse, ChatRequest, ChatCreateRequest, ChatCreateResponse, Chat, ChatMessage, ChatRenameRequest
from ..database import get_db, get_pool
from ..auth import get_current_user
import asyncpg
from ..services.chat_service import generate_stream, add_messages_to_db
import uuid
from typing import List
from google.cloud import storage
import os
from uuid import uuid4
from datetime import timedelta
from google.auth import compute_engine
import json

from google.oauth2 import service_account

router = APIRouter()

# --- Google Cloud Storage Setup ---
storage_client = storage.Client()
# --- Google Cloud Storage Setup ---

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB (same as frontend)

import datetime
import google.auth.impersonated_credentials
import google.auth.transport.requests

def get_impersonated_credentials():
    scopes = ['https://www.googleapis.com/auth/cloud-platform']
    credentials, project = google.auth.default(scopes=scopes)
    if credentials.token is None:
        credentials.refresh(google.auth.transport.requests.Request())
    signing_credentials = google.auth.impersonated_credentials.Credentials(
        source_credentials=credentials,
        target_principal=credentials.service_account_email,
        target_scopes=scopes,
        lifetime=datetime.timedelta(seconds=3600),
        delegates=[credentials.service_account_email]
    )
    return signing_credentials

# --- Raven Chat Endpoints ---
@router.post("/api/upload-url", response_model=PresignedUrlResponse)
async def create_upload_url(request_body: PresignedUrlRequest, user_id: str = Depends(get_current_user)):
    """Generates a presigned URL for uploading a file to GCS."""
    try:
        bucket_name = os.environ["GCS_BUCKET_NAME"]  # Get bucket name from environment variable
        bucket = storage_client.bucket(bucket_name)
        # Create a unique filename.  Good practice to prefix with user ID.
        blob_name = f"uploads/{user_id}/{uuid4()}-{request_body.filename}"
        blob = bucket.blob(blob_name)

        credentials=get_impersonated_credentials()
        # Generate the presigned URL
        url = blob.generate_signed_url(
            version="v4",
            credentials=credentials,
            expiration=timedelta(days=7),  # URL expires in 7 days
            method="PUT",  # Allow PUT requests (uploads)
            content_type=request_body.contentType,
        )
        download_url = blob.generate_signed_url(
            version="v4",
            credentials=credentials,
            expiration=timedelta(days=7),  # URL expires in 7 days
            method="GET",  # Allow GET requests (downloads)
        )
        # Return *both* the presigned URL *and* the final GCS URL
        return PresignedUrlResponse(url=url, gcs_url=download_url)

    except Exception as e:
        print(f"Error generating presigned URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate upload URL")

@router.post("/api/chats/create", response_model=ChatCreateResponse)
async def create_chat(chat_create_request: ChatCreateRequest, user_id: str = Depends(get_current_user), db: asyncpg.Connection = Depends(get_db)):
    chat_id = str(uuid.uuid4())
    try:
        # Check if the user exists
        user_exists = await db.fetchrow("SELECT 1 FROM users_raven WHERE id = $1", user_id)
        if not user_exists:
            raise HTTPException(status_code=400, detail="User not found")  # Or 404 if appropriate

        await db.execute('''
            INSERT INTO raven_chats (id, user_id, title, created_at)
            VALUES ($1, $2, $3, NOW())
        ''', chat_id, user_id, "New Chat")
        return ChatCreateResponse(chat_id=chat_id)
    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create chat: {e}")

@router.get("/api/chats", response_model=List[Chat])
async def get_chats(user_id: str = Depends(get_current_user), db: asyncpg.Connection = Depends(get_db)):
    try:
        query = "SELECT id, user_id, title, EXTRACT(EPOCH FROM created_at) as created_at FROM raven_chats WHERE user_id = $1 ORDER BY created_at DESC"  # Get all columns, convert timestamp
        rows = await db.fetch(query, user_id)
        chats = [Chat(chatId=row['id'], userId=row['user_id'], title=row['title'], createdAt=row['created_at']) for row in rows] # Use a list comprehension
        return chats
    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve chats: {e}")

@router.get("/api/chats/{chat_id}", response_model=List[ChatMessage])
async def get_chat_messages(chat_id: str, user_id: str = Depends(get_current_user), db: asyncpg.Connection = Depends(get_db)):
    try:
        chat_query = "SELECT id FROM raven_chats WHERE id = $1 AND user_id = $2"
        chat = await db.fetchrow(chat_query, chat_id, user_id)  # Use fetchrow for single row
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or access denied")

        query = """
            SELECT id, role, content, EXTRACT(EPOCH FROM timestamp) as timestamp, media_type, media_url
            FROM raven_messages
            WHERE chat_id = $1
            ORDER BY timestamp ASC
        """
        rows = await db.fetch(query, chat_id)

        messages = [
            ChatMessage(
                messageId=row['id'],
                role=row['role'],
                content=row['content'].strip(),
                timestamp=row['timestamp'],
                media_type=row['media_type'],
                media_url=row['media_url']
            )
            for row in rows
        ]
        return messages
    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve messages: {e}")

@router.patch("/api/chats/{chat_id}")  # Use PATCH for partial updates
async def rename_chat(chat_id: str, request_body: ChatRenameRequest, user_id: str = Depends(get_current_user), db: asyncpg.Connection = Depends(get_db)):
    try:
        # Check if the chat exists and belongs to the user
        result = await db.fetchrow("SELECT id FROM raven_chats WHERE id = $1 AND user_id = $2", chat_id, user_id)
        if not result:
            raise HTTPException(status_code=404, detail="Chat not found or access denied")

        # Update the chat title
        await db.execute("UPDATE raven_chats SET title = $1 WHERE id = $2", request_body.title, chat_id)
        return {"message": "Chat renamed successfully"}

    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to rename chat: {e}")

@router.delete("/api/chats/{chat_id}")
async def delete_chat(chat_id: str, user_id: str = Depends(get_current_user), db: asyncpg.Connection = Depends(get_db)):
    async with db.transaction():
        try:
            chat = await db.fetchrow("SELECT id FROM raven_chats WHERE id = $1 AND user_id = $2", chat_id, user_id)
            if not chat:
                raise HTTPException(status_code=404, detail="Chat not found or access denied")

            await db.execute("DELETE FROM raven_messages WHERE chat_id = $1", chat_id)
            await db.execute("DELETE FROM raven_chats WHERE id = $1", chat_id)
            return {"message": "Chat deleted successfully"}
        except Exception as e:
            print(f"Database error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to delete chat: {e}")

@router.post("/chat")
async def chat_endpoint(chat_request: ChatRequest, request: Request, user_id: str = Depends(get_current_user), pool: asyncpg.Pool = Depends(get_pool)):
    print(chat_request)
    if(len(chat_request.messages) >= 1):
        try:
            chat_id = chat_request.chatId
        except (IndexError, AttributeError) as e:
            print(f"Error extracting chat ID: {e}")
            raise HTTPException(status_code=400, detail="Invalid chat history format for existing chat.")
    else:
        chat_creation_request = ChatCreateRequest(user_id=user_id)
        async with pool.acquire() as db:
            created_chat = await create_chat(chat_creation_request, user_id, db)
            chat_id = created_chat.chat_id

    try:
        if chat_id:
            async with pool.acquire() as db:
                await add_messages_to_db(db, chat_request, chat_id, user_id)
        return StreamingResponse(generate_stream(pool, chat_request, request, chat_id, user_id), media_type="text/event-stream")
    except Exception as e:
        print(f"Database error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to insert message: {e}")