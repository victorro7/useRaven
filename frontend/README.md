# 🎨 Raven Frontend - Next.js Application

> **Modern React application with TypeScript, built for AI chat interactions**

The frontend of Raven is a sophisticated Next.js 14 application featuring real-time AI chat capabilities, multimodal file uploads, and a beautiful responsive design.

## ✨ Frontend Features

### 🤖 **Chat Interface**
- **Real-time streaming responses** with Server-Sent Events
- **Markdown rendering** with syntax highlighting for code blocks
- **Copy-to-clipboard** functionality for AI responses
- **Typing indicators** and loading states
- **Message history** with collapsible sidebar

### 📁 **File Upload System**
- **Drag-and-drop interface** supporting multiple files
- **Multi-format support**: Images, Videos, Audio, Documents
- **Real-time upload progress** with visual feedback
- **File type validation** and size limits (20MB)
- **Preview capabilities** for uploaded media

### 🎨 **Design & UX**
- **Responsive design** optimized for all devices
- **Dark theme** with custom gradient color palette
- **Smooth animations** using Framer Motion
- **Custom component library** with consistent styling
- **Mobile-first approach** with touch-friendly interactions

### 🔐 **Authentication**
- **Clerk integration** with Google OAuth
- **Protected routes** and user session management
- **SSO callback handling** for seamless authentication

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Authentication**: Clerk
- **Animation**: Framer Motion
- **UI Components**: Radix UI primitives
- **Icons**: Tabler Icons, React Icons, Lucide React
- **State Management**: Custom React hooks

## 🏗️ Project Structure

```
frontend/
├── 📁 app/                     # Next.js App Router
│   ├── 📁 (components)/        # Reusable React components
│   │   ├── 📁 auth/            # Authentication components
│   │   │   └── AuthForm.tsx    # Main authentication form
│   │   ├── 📁 buttons/         # Custom button components
│   │   │   ├── GradientButton.tsx
│   │   │   └── GradientBorderButton.tsx
│   │   ├── 📁 icons/           # SVG icon components
│   │   │   ├── LogoIcon.tsx
│   │   │   ├── SendIcon.tsx
│   │   │   ├── UploadIcon.tsx
│   │   │   └── Spinner.tsx
│   │   ├── 📁 ui/              # Base UI components
│   │   │   ├── button.tsx      # Shadcn/ui button
│   │   │   ├── input.tsx       # Form input component
│   │   │   ├── card.tsx        # Card container
│   │   │   ├── sidebar.tsx     # Sidebar component
│   │   │   ├── code-block.tsx  # Code syntax highlighting
│   │   │   ├── background-beams.tsx # Background animation
│   │   │   └── typewriter-effect.tsx # Typing animation
│   │   └── 📁 useChat/         # Chat-specific components
│   │       ├── ChatInput.tsx   # Message input component
│   │       ├── ChatMessage.tsx # Individual message display
│   │       ├── ChatSidebar.tsx # Chat history sidebar
│   │       ├── TypingIndicator.tsx # Loading animation
│   │       ├── useApiRequest.ts # API communication hook
│   │       ├── useChatMessages.ts # Message state management
│   │       ├── useChatState.ts # Chat state management
│   │       ├── useChats.ts     # Chat list management
│   │       ├── useMediaUpload.ts # File upload handling
│   │       ├── useTypewriter.tsx # Typewriter effect
│   │       └── constants.ts    # Chat constants
│   ├── 📁 chat/                # Chat pages
│   │   ├── 📁 [chatId]/        # Dynamic chat routes
│   │   │   └── page.tsx        # Individual chat page
│   │   ├── layout.tsx          # Chat layout wrapper
│   │   ├── page.tsx            # Main chat page
│   │   └── MobileLayout.tsx    # Mobile-specific layout
│   ├── 📁 sign-in/             # Authentication pages
│   │   └── page.tsx            # Sign-in page
│   ├── 📁 sso-callback/        # OAuth callback
│   │   └── page.tsx            # SSO callback handler
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── landingpage.tsx         # Landing page component
│   └── app.css                 # Global styles
├── 📁 lib/                     # Utility functions
├── 📁 .next/                   # Next.js build output
├── 📄 package.json             # Dependencies and scripts
├── 📄 next.config.mjs          # Next.js configuration
├── 📄 tailwind.config.ts       # Tailwind CSS configuration
├── 📄 tsconfig.json            # TypeScript configuration
└── 📄 README.md                # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **Backend running** on http://localhost:8000

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type checking
npm run type-check
```

### **Key Components**

#### `ChatInput`
- Message composition with file attachment
- Drag-and-drop file upload
- Send button with loading states
- Keyboard shortcuts (Enter to send)

#### `ChatMessage`
- Markdown rendering with syntax highlighting
- Copy-to-clipboard functionality
- User/AI message differentiation
- Timestamp display

#### `ChatSidebar`
- Chat history management
- Create new chat functionality
- Chat renaming and deletion
- Responsive collapse/expand

### **Components**
- **Buttons**: Gradient backgrounds with hover effects
- **Cards**: Rounded corners with subtle borders
- **Inputs**: Focus states with gradient borders
- **Animations**: Framer Motion for smooth transitions

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: `< 768px`
- **Tablet**: `768px - 1024px`
- **Desktop**: `> 1024px`

### **Mobile Features**
- Touch-friendly button sizes (min 44px)
- Swipe gestures for sidebar
- Optimized chat input for mobile keyboards
- Responsive file upload area

## 🧪 Testing & Development

### **Code Quality**
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting

### **Performance Optimizations**
- **Code splitting** with Next.js dynamic imports
- **Image optimization** with Next.js Image component
- **Bundle analysis** with `@next/bundle-analyzer`
- **Lazy loading** for non-critical components