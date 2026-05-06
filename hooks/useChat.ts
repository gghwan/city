'use client';

import { useCallback, useState } from 'react';
import type { AppMessage } from '@/types';

const CHAT_TIMEOUT_MS = 35_000;

async function readStream(
  response: Response,
  onChunk: (text: string) => void,
  signal: AbortSignal,
) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    if (signal.aborted) {
      throw new DOMException('요청이 중단되었습니다.', 'AbortError');
    }
    const { done, value } = await reader.read();
    if (done) break;
    const chunkText = decoder.decode(value, { stream: true });
    if (!chunkText) continue;
    fullText += chunkText;
    onChunk(chunkText);
  }

  const flushed = decoder.decode();
  if (flushed) {
    fullText += flushed;
    onChunk(flushed);
  }

  return fullText;
}

export function useChat(initialMessages: AppMessage[] = []) {
  const [messages, setMessages] = useState<AppMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      const nextMessages = [...messages, { role: 'user' as const, content: trimmed }];
      setMessages(nextMessages);
      setIsLoading(true);
      setError(null);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort('timeout'), CHAT_TIMEOUT_MS);
      let assistantInserted = false;

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: nextMessages }),
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('잠시 후 다시 시도해주세요.');
          }
          throw new Error('응답 생성 중 오류가 발생했습니다.');
        }

        let assistantText = '';
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
        assistantInserted = true;

        await readStream(
          response,
          (chunk) => {
            assistantText += chunk;
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (!last || last.role !== 'assistant') return prev;
              copy[copy.length - 1] = { ...last, content: assistantText };
              return copy;
            });
          },
          controller.signal,
        );

        if (!assistantText.trim()) {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (!last || last.role !== 'assistant') return prev;
            copy[copy.length - 1] = {
              ...last,
              content: '응답이 비어 있습니다. 다시 시도해주세요.',
            };
            return copy;
          });
        }
      } catch (err) {
        const message =
          err instanceof Error && err.name === 'AbortError'
            ? '응답 시간이 길어져 요청이 중단되었습니다. 다시 시도해주세요.'
            : err instanceof Error
            ? err.message
            : '응답 생성 중 오류가 발생했습니다.';

        if (assistantInserted) {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (!last || last.role !== 'assistant' || last.content.trim()) return prev;
            copy[copy.length - 1] = { ...last, content: message };
            return copy;
          });
        }
        setError(message);
      } finally {
        clearTimeout(timeout);
        setIsLoading(false);
      }
    },
    [isLoading, messages],
  );

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clear, setMessages };
}
