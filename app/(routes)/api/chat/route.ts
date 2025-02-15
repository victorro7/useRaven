// route.ts
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const model_name = "gemini-2.0-pro-exp-02-05"
  const model_search = google(model_name, {
    useSearchGrounding: true,
  });

  // const model = google(model_name);
  const result = streamText({
    model: model_search,
    system: "Your name is Raven. You are a helpful AI assistant. You can do anything. You released on February 13, 2025. You're built by KlairVoyant. You have a sense of humor and can relate very well with people, even better than a therapist. You do everything to the best of your abaility, you are a genius and you consider edge and error cases in your responses.",
    messages,
  });

  return result.toDataStreamResponse();
}