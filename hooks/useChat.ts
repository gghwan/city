'use client';

import { useCallback, useState } from 'react';
import type { AppMessage } from '@/types';

async function readStream(response: Response, onChunk: (text: string) => void) {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
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

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: nextMessages }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('잠시 후 다시 시도해주세요.');
          }
          throw new Error('응답 생성 중 오류가 발생했습니다.');
        }

        let assistantText = '';
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        await readStream(response, (chunk) => {
          assistantText += chunk;
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (!last || last.role !== 'assistant') return prev;
            copy[copy.length - 1] = { ...last, content: assistantText };
            return copy;
          });
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : '응답 생성 중 오류가 발생했습니다.';
        setError(message);
      } finally {
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
