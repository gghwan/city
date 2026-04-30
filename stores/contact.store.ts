'use client';

import { create } from 'zustand';
import type { EmergencyContactItem } from '@/types';

type ContactStore = {
  contacts: EmergencyContactItem[];
  setContacts: (contacts: EmergencyContactItem[]) => void;
};

export const useContactStore = create<ContactStore>((set) => ({
  contacts: [],
  setContacts: (contacts) => set({ contacts }),
}));
