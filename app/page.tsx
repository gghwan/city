import { redirect } from 'next/navigation';
import { getCachedServerSession } from '@/lib/session';

export default async function Home() {
  const session = await getCachedServerSession();
  redirect(session ? '/dashboard' : '/login');
}
