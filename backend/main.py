from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from uuid import uuid4
from google import genai
import os
from dotenv import load_dotenv
import asyncio
import json
import httpx
from clerk_backend_api import Clerk
from clerk_backend_api.jwks_helpers import authenticate_request, AuthenticateRequestOptions

load_dotenv()

client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])

app = FastAPI()

origins = [
    "http://localhost:3000",  # Or your frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatCreateRequest(BaseModel): #for later, once backend is required
    user_id: str  # You'll get this from Clerk
    title: Optional[str] = None  # Optional initial title

class ChatCreateResponse(BaseModel): #for later
    chat_id: str

@app.post("/api/chats/create", response_model=ChatCreateResponse) #for later
async def create_chat(chat_create_request: ChatCreateRequest):
    # 1. Generate a unique chat ID (e.g., using uuid4)
    chat_id = str(uuid4())

    # 2. Store the new chat in your database
    #    (You'll need to adapt this to your specific database)
    #    Example (pseudocode):
    #    new_chat = {
    #        "chat_id": chat_id,
    #        "user_id": chat_create_request.user_id,
    #        "title": chat_create_request.title or f"Chat {chat_id[:8]}", // Default title
    #        "messages": [],  // Start with an empty message list
    #    }
    #    your_database.chats.insert_one(new_chat)

    # 3. Return the chat ID
    return ChatCreateResponse(chat_id=chat_id)

class Message(BaseModel):
    role: str
    parts: list[str]

class ChatRequest(BaseModel):
    messages: list[Message]

def is_signed_in(request: httpx.Request):
    sdk = Clerk(bearer_auth=os.getenv('CLERK_SECRET_KEY'))
    request_state = sdk.authenticate_request(
        request,
        AuthenticateRequestOptions(
            authorized_parties=origins,
        )
    )
    return request_state.is_signed_in

async def generate_stream(chat_request: ChatRequest):
    try:
        model_name="gemini-2.0-pro-exp-02-05"
        message_list = ""
        for message in chat_request.messages:
            for part in message.parts:
                message_list += f"{message.role.upper()}: {part}\n"
        message_list += "ASSISTANT:"

        chat = client.chats.create(model=model_name,)
        response = chat.send_message_stream(message_list)

        for chunk in response:
            print(chunk.text)
            yield json.dumps({"response": chunk.text}) + "\n"
            await asyncio.sleep(0)

    except Exception as e:
        yield json.dumps({"error": str(e)}) + "\n"

@app.post("/chat")
async def chat_endpoint(chat_request: ChatRequest):
    return StreamingResponse(generate_stream(chat_request), media_type="text/event-stream")