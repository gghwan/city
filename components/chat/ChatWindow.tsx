'use client';

import { FormEvent, useState } from 'react';
import { Send, Sparkles, Trash2 } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { SUGGESTED_QUESTIONS } from '@/lib/constants';

export function ChatWindow() {
  const { messages, isLoading, error, sendMessage, clear } = useChat();
  const [input, setInput] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const value = input;
    setInput('');
    await sendMessage(value);
  };

  return (
    <section className="flex h-[calc(100vh-9rem)] h-[calc(100dvh-9rem)] flex-col overflow-hidden rounded-2xl border border-borderColor bg-white">
      <header className="flex items-center justify-between border-b border-borderColor bg-primary px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h2 className="text-sm font-bold">캠페인 AI 도우미</h2>
        </div>
        <button type="button" onClick={clear} className="rounded p-1 hover:bg-white/10" aria-label="기록 초기화">
          <Trash2 className="h-4 w-4" />
        </button>
      </header>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto overscroll-contain bg-surface p-4">
        {!messages.length && (
          <div className="space-y-4 rounded-xl border border-borderColor bg-white p-4">
            <p className="text-sm font-semibold">무엇이 궁금하신가요?</p>
            <div className="grid gap-2">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  type="button"
                  key={question}
                  onClick={() => setInput(question)}
                  className="rounded-lg border border-borderColor px-3 py-2 text-left text-xs text-textMuted hover:border-primary"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'text-right' : 'text-left'}>
            <div
              className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                message.role === 'user'
                  ? 'rounded-tr-none bg-primary text-white'
                  : 'rounded-tl-none border border-borderColor bg-white text-textBase'
              }`}
            >
              {message.content || (isLoading && message.role === 'assistant' ? '...' : '')}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="text-left">
            <span className="inline-block rounded-2xl rounded-tl-none border border-borderColor bg-white px-3 py-2 text-sm text-textMuted">
              답변 생성 중...
            </span>
          </div>
        )}

        {error && <p className="text-xs font-semibold text-error">{error}</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-borderColor p-3">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit(event);
            }
          }}
          placeholder="메시지를 입력하세요..."
          className="h-11 min-h-[44px] flex-1 resize-none rounded-xl border border-borderColor bg-surface px-3 py-2 text-base outline-none focus:border-primary md:text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="rounded-xl bg-primary px-3 text-white disabled:opacity-50"
          aria-label="전송"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </section>
  );
}
