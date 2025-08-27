# backend/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import asyncpg
from fastapi import Depends, Request

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(DATABASE_URL)  # This is for synchronous SQLAlchemy, not used directly with asyncpg
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) # Also for synchronous

Base = declarative_base() #for models

async def get_db_pool():
    try:
        # Setting statement_cache_size=0 to fix the pgbouncer prepared statement issue
        pool = await asyncpg.create_pool(
            DATABASE_URL, 
            min_size=1, 
            max_size=10,
            statement_cache_size=0  # This prevents the "prepared statement already exists" error
        )
        return pool
    except Exception as e:
        print(f"Failed to create connection pool: {e}")
        raise

async def init_db(app): #pass app
    try:
        app.state.db_pool = await get_db_pool()
        print("Connection pool initialized successfully")
    except Exception as e:
        print(f"Failed to initialize database: {e}")
        raise

async def close_db(app): #pass app
    if hasattr(app.state, 'db_pool') and app.state.db_pool:
        await app.state.db_pool.close()
        print("Connection pool closed successfully")

async def get_pool(request: Request) -> asyncpg.Pool:
    # Return the shared pool stored on the app state
    return request.app.state.db_pool

async def get_db(pool: asyncpg.Pool = Depends(get_pool)):
    conn = None
    try:
        conn = await pool.acquire()
        yield conn
    finally:
        if conn is not None:
            await pool.release(conn)