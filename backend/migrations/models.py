#models.py
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Text, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)  # Clerk user ID
    # Add other user fields as needed
    email = Column(String, unique=True)
    first_name = Column(String)
    profile_image_url = Column(Text)


class KlairVideo(Base):
    __tablename__ = "klair_videos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    upload_url = Column(Text)
    duration_seconds = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    # Add other video metadata as needed

class KlairClip(Base):
    __tablename__ = "klair_clips"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("klair_videos.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    start_time = Column(Integer, nullable=False)
    end_time = Column(Integer, nullable=False)
    transcript = Column(Text)
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    # Add other clip metadata as needed

class RavenChat(Base):
    __tablename__ = "raven_chats"

    id = Column(String, primary_key=True, index=True)  # Use the generated UUID
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class RavenMessage(Base):
    __tablename__ = "raven_messages"

    id = Column(String, primary_key=True, index=True)
    chat_id = Column(String, ForeignKey("raven_chats.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    media_type = Column(String)  # "text", "image", "video", etc. (for future use)
    media_url = Column(Text)      # URL in Cloud Storage (for future use)
    timestamp = Column(DateTime, default=datetime.utcnow)