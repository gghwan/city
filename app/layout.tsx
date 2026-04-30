import type { Metadata } from 'next';
import './globals.css';
import { APP_NAME } from '@/lib/constants';
import { AuthSessionProvider } from '@/components/providers/SessionProvider';

export const metadata: Metadata = {
  title: APP_NAME,
  description: '서울풍납 회중 2026 대도시 캠페인 운영 웹앱',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
