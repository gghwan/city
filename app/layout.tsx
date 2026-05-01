import type { Metadata, Viewport } from 'next';
import './globals.css';
import { APP_NAME } from '@/lib/constants';
import { AuthSessionProvider } from '@/components/providers/SessionProvider';
import { RouteLoadingOverlay } from '@/components/common/RouteLoadingOverlay';

export const metadata: Metadata = {
  title: APP_NAME,
  description: '서울풍납 회중 2026 대도시 캠페인 운영 웹앱',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon.svg',
    shortcut: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
        <RouteLoadingOverlay />
      </body>
    </html>
  );
}
