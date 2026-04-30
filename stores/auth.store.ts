'use client';

import { create } from 'zustand';
import type { SessionUser } from '@/types';

type AuthStore = {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
}));
