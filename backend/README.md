# 🐍 Raven Backend - FastAPI Application

> **High-performance Python API with AI integration and real-time capabilities**

The backend of Raven is a sophisticated FastAPI application featuring real-time AI chat streaming, multimodal file processing, and robust authentication.

## ✨ Backend Features

### 🤖 **AI Integration**
- **Google Gemini 2.5 Flash** integration for conversational AI
- **Real-time streaming responses** using Server-Sent Events
- **Multimodal processing** for images, videos, audio, and documents
- **Intelligent media inclusion** based on text references
- **Token-aware context management** with conversation summaries
- **Dynamic system instruction loading** from Google Cloud Storage
- **Vertex AI client** with gs:// URI support for seamless media processing

### 🔐 **Authentication & Security**
- **Clerk integration** with JWT token validation
- **Webhook handling** for user lifecycle management
- **CORS configuration** for secure cross-origin requests
- **Input validation** with Pydantic models
- **Secure file upload** with presigned URLs

### 📊 **Database Management**
- **PostgreSQL** with AsyncPG for high-performance operations
- **Alembic migrations** for version-controlled schema changes
- **SQLAlchemy models** with proper relationships
- **Connection pooling** for efficient resource management

### 🚀 **Performance & Scalability**
- **Async/await patterns** throughout the application
- **Concurrent processing** for multiple AI requests
- **Efficient file handling** with Google Cloud Storage
- **Optimized database queries** with proper indexing

## 🛠️ Technology Stack

- **Framework**: FastAPI (Python 3.11)
- **Database**: PostgreSQL with AsyncPG and connection pooling
- **AI**: Google Gemini 2.5 Flash + Vertex AI
- **Authentication**: Clerk Backend SDK with JWT validation
- **File Storage**: Google Cloud Storage with signed URLs
- **Migrations**: Alembic for schema versioning
- **Validation**: Pydantic v2 with comprehensive type checking
- **Context Management**: Rolling conversation summaries and token-aware windowing
- **Media Processing**: Intelligent inclusion with retry mechanisms

## 🏗️ Project Structure

```
backend/
├── 📁 routers/                 # API route handlers
│   ├── __init__.py            # Router initialization
│   └── raven.py               # Main chat and file routes
├── 📁 services/               # Business logic layer
│   ├── __init__.py            # Service initialization
│   ├── chat_service.py        # AI chat service with streaming
│   ├── message_service.py     # Message history and formatting
│   ├── token_service.py       # Token counting and management
│   ├── summary_service.py     # Rolling conversation summaries
│   ├── media_service.py       # Intelligent media inclusion
│   └── system_service.py      # Dynamic system instruction loading
├── 📁 migrations/             # Database schema migrations
│   ├── 📁 versions/           # Migration version files
│   ├── env.py                 # Alembic environment
│   └── script.py.mako         # Migration template
├── 📁 prompts/                # AI system prompts
│   └── system_prompts.py      # Prompt templates
├── 📄 main.py                 # FastAPI application entry point
├── 📄 database.py             # Database connection and models
├── 📄 auth.py                 # Authentication middleware
├── 📄 pymodels.py             # Pydantic data models
├── 📄 requirements.txt        # Python dependencies
├── 📄 alembic.ini             # Migration configuration
├── 📄 Dockerfile              # Container configuration
└── 📄 README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- **Python** 3.11+
- **PostgreSQL** database
- **Google Cloud** account with enabled APIs
- **Clerk** account for authentication

### Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 🔧 Environment Variables

Create a `.env` file with the following configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/raven_db

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret

# Google Cloud Configuration
PROJECT_ID=your-gcp-project-id
LOCATION=us-central1
GCS_BUCKET_NAME=your-storage-bucket-name

# AI Configuration
RAVEN_MODEL=gemini-2.5-flash
SYSTEM_INSTRUCTION_URL=gs://your-bucket/system_instruction.txt

# Context Management
CHAT_WINDOW_SIZE=20
MAX_CONTEXT_TOKENS=8000
TARGET_WINDOW_TOKENS=6000

# Summary Configuration
SUMMARY_TRIGGER_TOKENS=3500
SUMMARY_TARGET_TOKENS=400
SUMMARY_MAX_TOKENS=600
SUMMARY_MIN_MESSAGES=10
SUMMARY_KEEP_RECENT=5

# Media Settings
MEDIA_INCLUDE_ONLY_CURRENT=true
MEDIA_ALLOW_HISTORY_IF_REFERENCED=true
MEDIA_MAX_PARTS=3
MEDIA_MAX_IMAGES=2
MEDIA_MAX_VIDEOS=1

# Application Settings
PORT=8000
ENVIRONMENT=development
DEBUG=true
```

## 📊 API Documentation

### **Base URL**: `http://localhost:8000`

### Authentication Endpoints

#### `POST /clerk-webhook`
Handle Clerk user lifecycle events
- **Headers**: `svix-*` (Clerk webhook headers)
- **Body**: Clerk event payload
- **Response**: `200 OK` with confirmation message

### Chat Management

#### `GET /api/chats`
Retrieve user's chat history
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Response**: Array of chat objects with metadata

#### `POST /api/chats/create`
Create a new chat session
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Body**: `{ "title": "Optional chat title" }`
- **Response**: Chat object with unique ID

#### `GET /api/chats/{chat_id}`
Get specific chat messages
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Path**: `chat_id` - Unique chat identifier
- **Response**: Array of messages in the chat

#### `PATCH /api/chats/{chat_id}`
Rename a chat
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Body**: `{ "title": "New chat title" }`
- **Response**: Updated chat object

#### `DELETE /api/chats/{chat_id}`
Delete a chat and all its messages
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Response**: `200 OK` with confirmation

### AI Interaction

#### `POST /chat`
Send message and receive streaming AI response
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Content-Type**: `application/json`
- **Body**:
- **Response**: Server-Sent Events stream with AI response chunks

**Streaming Format**:
```
data: {"type": "chunk", "content": "AI response chunk"}
data: {"type": "done", "message_id": "msg_123"}
```

### File Upload

#### `POST /api/upload-url`
Generate presigned URL for secure file upload

## 🔒 Security Best Practices

### Input Validation
- All endpoints use Pydantic models for validation
- File type and size restrictions enforced
- SQL injection prevention with parameterized queries

### Authentication
- JWT tokens validated on every protected endpoint
- Webhook signature verification for Clerk events
- User permissions checked for resource access

### Data Protection
- Sensitive data encrypted at rest
- File uploads scanned for malicious content
- Rate limiting implemented for API endpoints