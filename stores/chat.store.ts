'use client';

import { create } from 'zustand';
import type { AppMessage } from '@/types';

type ChatStore = {
  messages: AppMessage[];
  setMessages: (messages: AppMessage[]) => void;
  pushMessage: (message: AppMessage) => void;
  clearMessages: () => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  setMessages: (messages) => set({ messages }),
  pushMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
}));
