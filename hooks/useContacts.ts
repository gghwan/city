'use client';

import { useEffect } from 'react';
import type { EmergencyContactItem } from '@/types';
import { useContactStore } from '@/stores/contact.store';

export function useContacts(initialContacts: EmergencyContactItem[]) {
  const contacts = useContactStore((state) => state.contacts);
  const setContacts = useContactStore((state) => state.setContacts);

  useEffect(() => {
    setContacts(initialContacts);
  }, [initialContacts, setContacts]);

  return { contacts, setContacts };
}
