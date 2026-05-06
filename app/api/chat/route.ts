import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { chatRateLimiter } from '@/lib/rate-limiter';
import { SYSTEM_PROMPT } from '@/lib/constants';
import { getMenuGuideResponse } from '@/lib/chat-menu-guide';

const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';
const GOOGLE_API_KEY = process.env.GOOGLE_AI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '';
const google = createGoogleGenerativeAI({
  apiKey: GOOGLE_API_KEY || undefined,
});

function toFallbackStream(message: string) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(message));
      controller.close();
    },
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const limited = await chatRateLimiter.limit(ip);
  if (!limited.success) {
    return new Response('Too Many Requests', { status: 429 });
  }

  const payload = (await request.json()) as {
    messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  };

  const messages = (payload.messages ?? [])
    .filter((msg) => msg && (msg.role === 'user' || msg.role === 'assistant'))
    .map((msg) => ({ role: msg.role, content: msg.content }));

  const latestUserMessage = [...(payload.messages ?? [])]
    .reverse()
    .find((message) => message.role === 'user')?.content;
  const menuGuideResponse = latestUserMessage ? getMenuGuideResponse(latestUserMessage) : null;

  if (menuGuideResponse) {
    return new Response(toFallbackStream(menuGuideResponse), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      status: 200,
    });
  }

  if (!GOOGLE_API_KEY) {
    const fallbackText = 'Google AI API 키가 설정되지 않았습니다. 담당자에게 문의하세요.';
    return new Response(toFallbackStream(fallbackText), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      status: 200,
    });
  }

  try {
    const result = streamText({
      model: google(GEMINI_MODEL),
      system: SYSTEM_PROMPT,
      messages,
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      },
    });

    return result.toTextStreamResponse({
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch {
    const fallbackText = 'AI 서비스를 일시적으로 사용할 수 없습니다. 담당자에게 문의하세요.';
    return new Response(toFallbackStream(fallbackText), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      status: 200,
    });
  }
}
