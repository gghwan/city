import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { getCachedServerSession } from '@/lib/session';

export default async function LoginPage() {
  const session = await getCachedServerSession();
  if (session) redirect('/dashboard');

  return <LoginForm />;
}
