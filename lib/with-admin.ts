import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { AppError } from '@/lib/errors';

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new AppError('E002', '로그인이 필요합니다', 401);
  }
  return session;
}

export async function withAdminAction<T>(fn: (session: Awaited<ReturnType<typeof requireSession>>) => Promise<T>) {
  const session = await requireSession();

  if (session.user.role !== 'ADMIN') {
    throw new AppError('E003', '관리자 권한이 필요합니다.', 403);
  }

  return fn(session);
}
