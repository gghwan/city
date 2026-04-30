import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';

export function AppShell({ children, isAdmin }: { children: React.ReactNode; isAdmin: boolean }) {
  return (
    <div className="min-h-screen bg-bg text-textBase">
      <Header isAdmin={isAdmin} />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
