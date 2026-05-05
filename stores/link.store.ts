'use client';

import { create } from 'zustand';
import type { LinkSet } from '@/types';

type LinkStore = {
  links: LinkSet;
  setLinks: (links: LinkSet) => void;
};

export const useLinkStore = create<LinkStore>((set) => ({
  links: {
    map: { url: '', updatedAt: null },
    card: { url: '', updatedAt: null },
    talk: { url: '', updatedAt: null },
  },
  setLinks: (links) => set({ links }),
}));
