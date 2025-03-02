# backend/main.py (Minimal - Imports Routers)
from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from routers import raven, klair  # Import the routers
from database import init_db, close_db
from pymodels import *
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# --- CORS ---
origins = [
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

# --- Event Handlers (Database Connection)---
@app.on_event("startup")
async def startup():
    await init_db(app)

@app.on_event("shutdown")
async def shutdown():
    await close_db(app)  # Ensure the pool is closed

# --- Include Routers ---
app.include_router(raven.router)
app.include_router(klair.router)