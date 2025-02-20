from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import uuid4
import os
from dotenv import load_dotenv
import asyncio
import json
import asyncpg
import httpx
import uuid
from typing import AsyncGenerator
from clerk_backend_api import Clerk
from clerk_backend_api.jwks_helpers import AuthenticateRequestOptions


load_dotenv()

app = FastAPI()

# --- CORS ---
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

class ChatRenameRequest(BaseModel):
    title: str

class ChatRequest(BaseModel):
    messages: list[Message]
    chatId: Optional[str] = None

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
# --- Database Connection Pool ---

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

# --- Authentication (Clerk) - Using clerk-backend-api ---
def get_clerk_request(request: httpx.Request):
    sdk = Clerk(bearer_auth=os.getenv('CLERK_SECRET_KEY'))
    request_state = sdk.authenticate_request(
    request,
        AuthenticateRequestOptions(
        authorized_parties=origins,
    )
    )
    return request_state

async def get_current_user(request: Request):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        request_state = get_clerk_request(request)

        if request_state.is_signed_in:
            # print(request_state.payload['sub'])
            return request_state.payload['sub']
        else:
            raise HTTPException(status_code=401, detail="Invalid token")

    except Exception as e:
        print(f"Authentication error: {e}") #log errors
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
# --- Authentication (Clerk) - Using clerk-backend-api ---

# --- API Endpoints ---
@app.post("/api/chats/create", response_model=ChatCreateResponse)
async def create_chat(chat_create_request: ChatCreateRequest, user_id: str = Depends(get_current_user), db: asyncpg.Connection = Depends(get_db)):
    chat_id = str(uuid4())
    try:
        # Check if the user exists
        user_exists = await db.fetchrow("SELECT 1 FROM users WHERE id = $1", user_id)
        if not user_exists:
            raise HTTPException(status_code=400, detail="User not found")  # Or 404 if appropriate

        await db.execute('''
            INSERT INTO raven_chats (id, user_id, title, created_at)
            VALUES ($1, $2, $3, NOW())
        ''', chat_id, user_id, chat_create_request.title or f"Chat {chat_id[:8]}")
        return ChatCreateResponse(chat_id=chat_id)
    except Exception as e:
        print(f"Database error: {e}")
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

@app.patch("/api/chats/{chat_id}")  # Use PATCH for partial updates
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

@app.post("/chat")
async def chat_endpoint(chat_request: ChatRequest, request: Request, user_id: str = Depends(get_current_user), db: asyncpg.Connection = Depends(get_db)):

    if(len(chat_request.messages) >= 1):
        try:
            chat_id = chat_request.chatId
        except (IndexError, AttributeError) as e:
            print(f"Error extracting chat ID: {e}")
            raise HTTPException(status_code=400, detail="Invalid chat history format for existing chat.")
    else:
        chat_creation_request = ChatCreateRequest(user_id=user_id)
        created_chat = await create_chat(chat_creation_request, user_id, db)
        chat_id = created_chat.chat_id

    try:
        await add_messages_to_db(db, chat_request, chat_id, user_id)
        return StreamingResponse(generate_stream(db, chat_request, request, chat_id, user_id), media_type="text/event-stream")
    except Exception as e:
        print(f"Database error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to insert message: {e}")
# --- API Endpoints ---

# --- Helper Functions ---
async def generate_stream(db, chat_request: ChatRequest, request: Request, chat_id: str, user_id: str) -> AsyncGenerator[str, None]:
    try:
        db = await get_db_pool() #get the pool
        conn = await db.acquire() #get connection

        model_name = "gemini-2.0-pro-exp-02-05"
        message_list = ""
        for message in chat_request.messages:
            for part in message.parts:
                message_list += f"{message.role.upper()}: {part}\n"
        message_list += "ASSISTANT:"

        response_text = ""
        for chunk in client.models.generate_content_stream(
            model=model_name,
            contents=[message_list]
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
    """
    Adds a single message with a specified role and content to the database.

    Args:
        db: The database connection object.
        chat_id: The ID of the chat.
        user_id: The ID of the user.
        role: The role of the message (e.g., "user", "assistant").
        content: The text content of the message.
    """
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
    """
    Adds messages from one or more chat requests to the database.

    Args:
        db: The database connection object.
        chat_requests: A chat request object or a list of chat request objects, each containing messages.
        chat_id: The ID of the chat.
        user_id: The ID of the user.
    """
    if not isinstance(chat_requests, list):
        chat_requests = [chat_requests]

    for chat_request in chat_requests:
        messages_to_add = get_last_messages(chat_request.messages)

        if messages_to_add:
            print(messages_to_add)
            for message in messages_to_add:
                message_id = str(uuid.uuid4())
                role = message.role
                content = message.parts[0]

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
                    print(f"Error: role or content missing from message: {message}")
        else:
            print("No messages to insert for this chat request.")

def get_last_messages(chat_messages):
    """
    Retrieves the last message(s) from a list of chat messages.

    Args:
        chat_messages: A list of dictionaries, where each dictionary represents a chat message.

    Returns:
        A list containing the last two messages, or the last message if there is only one, or an empty list if there are no messages.
    """
    if not chat_messages:
        return []

    if len(chat_messages) >= 1:
        return chat_messages[-1:] #return the last message in a list.
# --- Helper Functions ---