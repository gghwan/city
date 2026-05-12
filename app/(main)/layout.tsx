import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { getCachedServerSession } from '@/lib/session';
import { getNotices } from '@/actions/notice.actions';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getCachedServerSession();
  if (!session) redirect('/login');

  let notices: Awaited<ReturnType<typeof getNotices>> = [];
  try {
    notices = await getNotices();
  } catch (error) {
    console.error('[MainLayout] 공지 조회 실패:', error);
  }

  return (
    <AppShell isAdmin={session.user.role === 'ADMIN'} username={session.user.username} notices={notices}>
      {children}
    </AppShell>
  );
}
