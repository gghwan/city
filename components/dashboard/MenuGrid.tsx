import { FileText, Home, Map, PhoneCall } from 'lucide-react';
import { MenuCard } from '@/components/dashboard/MenuCard';

const items = [
  {
    href: '/service',
    title: '봉사 마련',
    description: '봉사 배정 및 회중 봉사 마련',
    icon: FileText,
    color: '#01696f',
  },
  {
    href: '/map',
    title: '구역 지도',
    description: '한강공원, 올림픽공원 외',
    icon: Map,
    color: '#964219',
  },
  {
    href: '/card',
    title: '호별 카드',
    description: '서울풍납 회중 전자 구역 카드',
    icon: Home,
    color: '#437a22',
  },
  {
    href: '/emergency',
    title: '비상 연락',
    description: '담당자 및 봉사 인도자',
    icon: PhoneCall,
    color: '#a12c7b',
  },
];

export function MenuGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <MenuCard key={item.href} {...item} />
      ))}
    </div>
  );
}
