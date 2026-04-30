'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import type { SessionUser } from '@/types';

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  return {
    id: session.user.id,
    username: session.user.username,
    role: session.user.role,
  };
}
