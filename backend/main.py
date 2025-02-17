from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
import os
from dotenv import load_dotenv
import asyncio
import json

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

class Message(BaseModel):
    role: str
    parts: list[str]

class ChatRequest(BaseModel):
    messages: list[Message]

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