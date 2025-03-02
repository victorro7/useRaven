// types/ai-sdk.d.ts

declare module '@ai-sdk/react' {
    interface UseChatHelpers {  // No import needed
        stream: (options: { messages: any[] }) => Promise<void>;
    }
}

export {}; // Add this line