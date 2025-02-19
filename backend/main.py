from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import uuid4
import os
from dotenv import load_dotenv
import asyncio
import json
import asyncpg  # Use asyncpg directly
import httpx
from clerk_backend_api import Clerk
from clerk_backend_api.jwks_helpers import authenticate_request, AuthenticateRequestOptions

load_dotenv()

app = FastAPI()

# --- CORS (Keep this) ---
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
# --- CORS ---

# --- Pydantic Models ---
class Message(BaseModel):
    role: str
    parts: list[str]

class ChatRequest(BaseModel):
    messages: list[Message]
class ChatCreateRequest(BaseModel):  # For creating new chats
    user_id: str  # Get from Clerk
    title: Optional[str] = None
class ChatCreateResponse(BaseModel):
    chat_id: str

class ChatMessage(BaseModel): #for returning chat messages.
    messageId: str
    role: str
    content: str
    timestamp: float

class Chat(BaseModel): #for returning chats.
    chatId: str
    userId: str
    title: str
    createdAt: float
# --- Pydantic Models ---

# --- Gemini Setup (Keep This)---
from google import genai
client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
# --- Gemini Setup ---

# --- Database Connection Pool ---
async def get_db_pool():
    try:
        pool = await asyncpg.create_pool(os.environ["DATABASE_URL"])
        return pool
    except Exception as e:
        print(f"Failed to create connection pool: {e}")
        raise  # Re-raise the exception to prevent startup

async def init_db():
    try:
        app.state.db_pool = await get_db_pool()
        print("Connection pool initialized successfully")
    except Exception as e:
        print(f"Failed to initialize database: {e}")
        raise

async def close_db():
    if hasattr(app.state, 'db_pool') and app.state.db_pool:
        await app.state.db_pool.close()
        print("Connection pool closed successfully")

@app.on_event("startup")
async def startup():
    await init_db()

@app.on_event("shutdown")
async def shutdown():
    await close_db()  # Ensure the pool is closed


# --- Dependency for getting a database connection ---
async def get_db():
    conn = None
    try:
        conn = await app.state.db_pool.acquire()
        yield conn
    finally:
        if conn is not None:
            await app.state.db_pool.release(conn)
# --- Dependency for getting a database connection---

def is_signed_in(request: httpx.Request):
    sdk = Clerk(bearer_auth=os.getenv('CLERK_SECRET_KEY'))
    request_state = sdk.authenticate_request(
        request,
        AuthenticateRequestOptions(
            authorized_parties=origins,
        )
    )
    print(request_state.is_signed_in)
    return request_state.is_signed_in

# --- Helper function for auth (Placeholder - NEEDS CLERK INTEGRATION) ---
async def get_current_user(request: Request):
    valid_user = is_signed_in(request)

    auth_header = request.headers.get('Authorization')
    if not auth_header:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        token = auth_header.split(" ")[1]  # CORRECT: Extract token
        print(token)
        clerk_client = Clerk(bearer_auth=os.getenv('CLERK_SECRET_KEY'))
        # clerk_client = Clerk(api_key=os.environ["CLERK_SECRET_KEY"])
        # print(clerk_client.sessions.get(session_id="sess_2tFTSCk2HLUDrCykW0AZinB2h1q"))
        # jwt_session = clerk_client.sessions.verify_session(token)
        return "user_2t9aAwiUsishz1NuSJi13WPH9IK"
        # return jwt_session.user_id  # CORRECT: Get user_id
    
    except Exception as e:
        print(f"Authentication error: {e}") #log errors
        raise HTTPException(
            status_code=333,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
# --- API Endpoints ---

@app.post("/api/chats/create", response_model=ChatCreateResponse)
async def create_chat(chat_create_request: ChatCreateRequest, user_id: str = Depends(get_current_user), db: asyncpg.Connection = Depends(get_db)):
    chat_id = str(uuid4())
    try:
        await db.execute('''
            INSERT INTO raven_chats (id, user_id, title, created_at)
            VALUES ($1, $2, $3, NOW())
        ''', chat_id, user_id, chat_create_request.title or f"Chat {chat_id[:8]}")
        return ChatCreateResponse(chat_id=chat_id)
    except Exception as e:
        print(f"Database error: {e}")  # More specific error logging
        raise HTTPException(status_code=500, detail=f"Failed to create chat: {e}")

@app.get("/api/chats", response_model=List[Chat])
async def get_chats(user_id: str = Depends(get_current_user), db: asyncpg.Connection = Depends(get_db)):
    try:
        query = "SELECT id, user_id, title, EXTRACT(EPOCH FROM created_at) as created_at FROM raven_chats WHERE user_id = $1 ORDER BY created_at DESC"  # Get all columns, convert timestamp
        rows = await db.fetch(query, user_id)
        chats = [Chat(chatId=row['id'], userId=row['user_id'], title=row['title'], createdAt=row['created_at']) for row in rows] # Use a list comprehension
        return chats
    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve chats: {e}")

@app.get("/api/chats/{chat_id}", response_model=List[ChatMessage])
async def get_chat_messages(chat_id: str, user_id: str = Depends(get_current_user), db: asyncpg.Connection = Depends(get_db)):
    try:
        chat_query = "SELECT id FROM raven_chats WHERE id = $1 AND user_id = $2"
        chat = await db.fetchrow(chat_query, chat_id, user_id)  # Use fetchrow for single row
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or access denied")

        query = "SELECT id, role, content, EXTRACT(EPOCH FROM timestamp) as timestamp FROM raven_messages WHERE chat_id = $1 ORDER BY timestamp ASC"
        rows = await db.fetch(query, chat_id)

        messages = [ChatMessage(messageId=row['id'], role=row['role'], content=row['content'].strip(), timestamp=row['timestamp']) for row in rows]
        return messages
    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve messages: {e}")

@app.delete("/api/chats/{chat_id}")
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

async def generate_stream(chat_request: ChatRequest, request: Request, chat_id: str):
    try:
        model_name = "gemini-2.0-flash"
        message_list = ""
        for message in chat_request.messages:
            for part in message.parts:
                message_list += f"{message.role.upper()}: {part}\n"
        message_list += "ASSISTANT:"

        for chunk in client.models.generate_content_stream(
            model=model_name,
            contents=[message_list]
        ):
            if await request.is_disconnected():
                print("Client disconnected")
                return

            # print(chunk.text) # Keep commented out unless debugging
            yield json.dumps({"response": chunk.text}) + "\n"
            await asyncio.sleep(0)


    except Exception as e:
        yield json.dumps({"error": str(e)}) + "\n"

@app.post("/chat")
async def chat_endpoint(chat_request: ChatRequest, request: Request, user_id: str = Depends(get_current_user), db: asyncpg.Connection = Depends(get_db)):
    if(len(chat_request.messages) > 1):
        chat_id = chat_request.messages[0].parts[0].split('-')[1]
        print(chat_id)
    else:
        chat_creation_request = ChatCreateRequest(user_id=user_id)
        created_chat = await create_chat(chat_creation_request, user_id, db)
        chat_id = created_chat.chat_id

    last_message = chat_request.messages[-1]
    message_id = str(uuid4())

    try:
        await db.execute('''
            INSERT INTO raven_messages (id, chat_id, user_id, role, content, timestamp)
            VALUES ($1, $2, $3, $4, $5, NOW())
        ''', message_id, chat_id, user_id, last_message.role, last_message.parts[0])  # Removed extra comma

        return StreamingResponse(generate_stream(chat_request, request, chat_id), media_type="text/event-stream")
    except Exception as e:
        print(f"Database error in chat endpoint: {e}") #more specific error
        raise HTTPException(status_code=500, detail=f"Failed to insert message: {e}")