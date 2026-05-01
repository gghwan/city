import { cache } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';

export const getCachedServerSession = cache(() => getServerSession(authOptions));
