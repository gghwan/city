import { MessageCircle } from 'lucide-react';
import { NavigationLink } from '@/components/common/NavigationLink';
import { MenuGrid } from '@/components/dashboard/MenuGrid';

export default function DashboardPage() {
  return (
    <section>
      <p className="mb-4 text-xs text-textMuted">캠페인 핵심 메뉴</p>
      <MenuGrid />

      <NavigationLink
        href="/chat"
        prefetch
        className="fixed bottom-20 right-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30"
        aria-label="챗봇 열기"
      >
        <MessageCircle className="h-6 w-6" />
      </NavigationLink>
    </section>
  );
}
