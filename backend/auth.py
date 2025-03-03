# backend/auth.py
import os
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer
import httpx
from clerk_backend_api import Clerk
from clerk_backend_api.jwks_helpers import AuthenticateRequestOptions
from dotenv import load_dotenv

load_dotenv()

# Get Clerk secret key from environment variables
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")

# Define your allowed origins (replace with your frontend URL)
origins = [
    "http://localhost:3000",
    "https://useraven.app",
]

# Initialize Clerk SDK
clerk_sdk = Clerk(bearer_auth=CLERK_SECRET_KEY)

def get_clerk_request(request: httpx.Request):

    request_state = clerk_sdk.authenticate_request(
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