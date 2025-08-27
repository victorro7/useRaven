# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from svix.webhooks import Webhook, WebhookVerificationError
from .routers import raven
from .database import init_db, close_db, get_db
from .pymodels import *
import os
from dotenv import load_dotenv
import asyncpg
import uvicorn

load_dotenv()

app = FastAPI()

# Get the Clerk webhook secret from environment variables
webhook_secret = os.getenv("CLERK_WEBHOOK_SECRET")
if not webhook_secret:
    raise ValueError("CLERK_WEBHOOK_SECRET environment variable not set!")

# --- CORS ---
origins = [
    "https://useraven.app",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- CORS ---

@app.post("/clerk-webhook")
async def clerk_webhook(request: Request, db: asyncpg.Connection = Depends(get_db)):
    """Handles Clerk webhooks."""
    print("request: ", request)
    payload = await request.body()
    print("payload: ", payload)
    headers = request.headers
    print("header: ", headers)
    try:
        wh = Webhook(webhook_secret)
        print("wb: ", wh)
        evt = wh.verify(payload, headers)  # Verify the webhook signature
        print("evt: ", evt)
        data = evt['data']
        print("data: ", data)
        event_type = evt['type']
        print("evt_type: ", event_type)
        event_id = headers.get('svix-id') # Get the event ID for idempotency
        print("event_id: ", event_id)


    except WebhookVerificationError as e:
        print("WebhookVerificationError", e)
        raise HTTPException(status_code=400, detail=f"Webhook verification failed: {e}")
    except Exception as e:
        print("Exception: ", e)
        raise HTTPException(status_code=400, detail=str(e))

    # Check if we've already processed this event (idempotency)
    try:
        try:
            print(f"Checking for existing event with ID: {event_id}")
            existing_event = await db.fetchrow("SELECT * FROM processed_webhooks WHERE event_id = $1", event_id)
            if existing_event:
                return JSONResponse({"message": "Event already processed"}, status_code=200)
        except Exception as e:
            print(f"Error in idempotency check: {e}") # Add this for debugging
            raise HTTPException(status_code=500, detail=f"Error in idempotency check: {e}")

        print("existing satement: ", existing_event)
        if existing_event:
            return JSONResponse({"message": "Event already processed"}, status_code=200) # Or 204 No Content

        print("event_type choosing: ", event_type)
        # Process the event based on its type
        if event_type == "user.created":
            await create_user(db, data)
        else:
            print(f"Unhandled event type: {event_type}")
            return JSONResponse({"message": f"Unhandled event type: {event_type}"}, status_code=200)

        print("after user functions")
        # Mark the event as processed
        await db.execute("INSERT INTO processed_webhooks (event_id) VALUES ($1)", event_id)
        return JSONResponse({"message": "Webhook processed successfully"}, status_code=200)

    except Exception as e:
        print(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing webhook: {e}")

async def create_user(db, user_data: Dict):
    """Creates a new user in the database."""
    print("create user data:", user_data)
    try:
        # Extract relevant data from the user_data dictionary
        user_id = user_data['id']
        print("user_id: ", user_id)
        email = user_data['email_addresses'][0]['email_address']  # Get the primary email
        print("email: ", email)
        first_name = user_data.get('first_name')  # Use .get() for optional fields
        print("first name: ", first_name)
        last_name = user_data.get('last_name')
        print ("last name: ", last_name)
        profile_image_url = user_data.get('profile_image_url')
        print("profile_image_url: ", profile_image_url)

        await db.execute('''
            INSERT INTO users_raven (id, email, first_name, last_name, profile_image_url)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO NOTHING  -- Handle potential duplicates
        ''', user_id, email, first_name, last_name, profile_image_url)
        print(f"User created: {user_id}")

    except Exception as e:
        print(f"Error creating user: {e}")
        raise  # Re-raise the exception to be caught by the main webhook handler

# --- Database Schema (Add the 'users' table and 'processed_webhooks' table) ---
async def create_tables(db):
    """Creates the necessary database tables."""
    async with db.acquire() as connection:
        await connection.execute('''
            CREATE TABLE IF NOT EXISTS users_raven (
                id TEXT PRIMARY KEY,
                email TEXT,
                first_name TEXT,
                last_name TEXT,
                profile_image_url TEXT
            )
        ''')
        # Create a table to track processed webhook events (for idempotency)
        await connection.execute('''
            CREATE TABLE IF NOT EXISTS processed_webhooks (
                event_id TEXT PRIMARY KEY
            )
        ''')
        print("users and processed_webhooks tables created (if they didn't exist).")

# --- Event Handlers (Database Connection)---
@app.on_event("startup")
async def startup():
    await init_db(app)
    # Use the shared pool initialized on app.state for table creation
    await create_tables(app.state.db_pool)

@app.on_event("shutdown")
async def shutdown():
    await close_db(app)  # Ensure the pool is closed

# --- Include Routers ---
app.include_router(raven.router)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))  # Get PORT from env, default to 8080
    uvicorn.run(app, host="0.0.0.0", port=port)