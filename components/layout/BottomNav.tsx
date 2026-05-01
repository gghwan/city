'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Home, Map, PhoneCall, Smartphone } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: '홈', icon: Home },
  { href: '/service', label: '봉사마련', icon: FileText },
  { href: '/map', label: '구역지도', icon: Map },
  { href: '/card', label: '호별카드', icon: Smartphone },
  { href: '/emergency', label: '비상연락', icon: PhoneCall },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-borderColor bg-white md:bg-white/95 md:backdrop-blur">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-around px-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-xl px-2 py-1 text-[10px] font-bold transition ${
                active ? 'text-primary' : 'text-textMuted'
              }`}
            >
              <item.icon className="mb-1 h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
