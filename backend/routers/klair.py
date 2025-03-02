# backend/routers/klair.py
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from pymodels import PresignedUrlRequest, PresignedUrlResponse, VideoCreateRequest, VideoCreateResponse, Video
from database import get_db
from auth import get_current_user
import asyncpg
from google.cloud import storage
import os
import uuid
from datetime import timedelta
from services.chat_service import add_messages_to_db, generate_stream, add_custom_message_to_db  # Import service functions

router = APIRouter()

# --- Google Cloud Storage Client ---
storage_client = storage.Client()

@router.post("/api/klair/upload-url", response_model=PresignedUrlResponse)
async def create_klair_upload_url(request_body: PresignedUrlRequest, user_id: str = Depends(get_current_user)):
    """Generates a presigned URL for uploading a VIDEO to GCS."""
    try:
        bucket_name = os.environ["GCS_BUCKET_NAME"]  # Use the SAME bucket, or a different one
        bucket = storage_client.bucket(bucket_name)
        blob_name = f"videos/{user_id}/{uuid.uuid4()}-{request_body.filename}" # good practice
        blob = bucket.blob(blob_name)

        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=60),  # Longer expiration for videos
            method="PUT",
            content_type=request_body.contentType,
        )
        return PresignedUrlResponse(url=url, gcs_url=f"https://storage.googleapis.com/{bucket_name}/{blob_name}")

    except Exception as e:
        print(f"Error generating presigned URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate upload URL")

@router.post("/api/klair/videos", response_model=VideoCreateResponse)
async def create_klair_video(
    request_body: VideoCreateRequest,
    user_id: str = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db)
):
    """Creates a database entry for a Klair video AFTER successful upload to GCS."""
    try:
        async with db.transaction():
            # Insert the video record, including the file_uri and upload_url
            result = await db.fetchrow(
                """
                INSERT INTO klair_videos (user_id, filename, upload_url, duration_seconds)
                VALUES ($1, $2, $3, $4)
                RETURNING id;
                """,
                user_id,
                request_body.filename,
                request_body.upload_url,
                request_body.duration_seconds,
            )

            if not result:
                raise HTTPException(status_code=500, detail="Failed to create video record")

            return VideoCreateResponse(video_id=result['id'])

    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create video: {e}")

@router.get("/api/klair/videos/{video_id}", response_model=Video)
async def get_klair_video(video_id: int, user_id: str = Depends(get_current_user), db: asyncpg.Connection = Depends(get_db)):
    """Retrieves details for a specific Klair video."""
    try:
        async with db.acquire() as conn:
            video_record = await conn.fetchrow(
                "SELECT *, EXTRACT(EPOCH FROM created_at) as created_at FROM klair_videos WHERE id = $1 AND user_id = $2", video_id, user_id
            )
            if not video_record:
                raise HTTPException(status_code=404, detail="Video not found or access denied")
            video = Video(
                id=video_record['id'],
                user_id=video_record['user_id'],
                filename=video_record['filename'],
                upload_url=video_record['upload_url'],
                duration_seconds=video_record['duration_seconds'],
                created_at=video_record['created_at'],
                chat_id=video_record['chat_id'],
                file_uri = video_record['file_uri']
            )
            return video

    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve video: {e}")
    
