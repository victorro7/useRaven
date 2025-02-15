# main.py (FastAPI backend)
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import List, Annotated, Optional
import uuid
import shutil
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware # Import

app = FastAPI()

# --- CORS Configuration ---
origins = [
    "http://localhost:3000",  # Allow requests from your Next.js frontend
    # Add any other origins you need to allow (e.g., a production URL)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- File Upload ---
# IMPORTANT: This is now relative to the *Next.js project root*, NOT the FastAPI root.
UPLOAD_DIR = Path("./public/uploads")
UPLOAD_DIR.mkdir(exist_ok=True, parents=True) # Create directory


async def save_upload_file(upload_file: UploadFile, destination: Path):
    try:
        with destination.open("wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
    finally:
        await upload_file.close()


@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    try:
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        await save_upload_file(file, file_path)

        # Return the filename (Next.js will construct the URL)
        return JSONResponse({"message": "File uploaded successfully", "filename": unique_filename})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {e}")


@app.post("/api/process-url")
async def process_url(url: str = Form(...)):  # Use Form for consistency
    try:
        # For now return success
        print(f"Received URL: {url}")
        return JSONResponse({"message": "URL received", "url": url})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing URL: {e}")


# Example route, adapt as needed
@app.get("/")
async def root():
    return {"message": "Hello from FastAPI!"}

# --- NO StaticFiles app.mount HERE ---