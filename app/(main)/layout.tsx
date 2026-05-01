import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { getCachedServerSession } from '@/lib/session';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getCachedServerSession();
  if (!session) redirect('/login');

  return <AppShell isAdmin={session.user.role === 'ADMIN'}>{children}</AppShell>;
}
