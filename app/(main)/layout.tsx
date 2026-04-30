import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth.config';
import { AppShell } from '@/components/layout/AppShell';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return <AppShell isAdmin={session.user.role === 'ADMIN'}>{children}</AppShell>;
}
