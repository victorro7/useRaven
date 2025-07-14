# 🐍 Raven Backend - FastAPI Application

> **High-performance Python API with AI integration and real-time capabilities**

The backend of Raven is a sophisticated FastAPI application featuring real-time AI chat streaming, multimodal file processing, and robust authentication.

## ✨ Backend Features

### 🤖 **AI Integration**
- **Google Gemini 2.0 Pro** integration for conversational AI
- **Real-time streaming responses** using Server-Sent Events
- **Multimodal processing** for images, videos, audio, and documents
- **Google Search integration** for enhanced contextual responses
- **Intelligent prompt engineering** with customizable system prompts

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
- **Database**: PostgreSQL with AsyncPG
- **AI**: Google Gemini 2.0 Pro + Vertex AI
- **Authentication**: Clerk Backend SDK
- **File Storage**: Google Cloud Storage
- **Migrations**: Alembic
- **Validation**: Pydantic v2
- **HTTP Client**: httpx for async requests

## 🏗️ Project Structure

```
backend/
├── 📁 routers/                 # API route handlers
│   ├── __init__.py            # Router initialization
│   └── raven.py               # Main chat and file routes
├── 📁 services/               # Business logic layer
│   ├── __init__.py            # Service initialization
│   └── chat_service.py        # AI chat service
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
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
GCS_BUCKET_NAME=your-storage-bucket-name

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_SEARCH_API_KEY=your_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id

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