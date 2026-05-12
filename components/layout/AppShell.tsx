import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { UserNoticeLayer } from '@/components/notice/UserNoticeLayer';
import type { NoticeItem } from '@/types';

export function AppShell({
  children,
  isAdmin,
  username,
  notices,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
  username: string;
  notices: NoticeItem[];
}) {
  return (
    <div className="min-h-screen bg-bg text-textBase">
      <Header isAdmin={isAdmin} username={username} />
      <UserNoticeLayer notices={notices} />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-4">{children}</main>
      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
