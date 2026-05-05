import { Bell, FileText, Home, Map, MessageCircle, PhoneCall } from 'lucide-react';
import { MenuCard } from '@/components/dashboard/MenuCard';

const items = [
  {
    href: '/service',
    title: '봉사 마련',
    description: '게스트 봉사 배정 및 회중 봉사 마련',
    icon: FileText,
    color: '#01696f',
  },
  {
    href: '/emergency',
    title: '비상 연락',
    description: '캠페인 담당자, 봉사 인도자 연락처',
    icon: PhoneCall,
    color: '#a12c7b',
  },
  {
    href: '/map',
    title: '구역 지도',
    description: '한강공원, 올림픽공원, 아산병원',
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
    href: '/talk',
    title: '대화 방법',
    description: '구역별 대화 방법 제안',
    icon: MessageCircle,
    color: '#6b4ce6',
  },
  {
    href: '/notice',
    title: '공지사항',
    description: '캠페인 운영 공지',
    icon: Bell,
    color: '#d17b00',
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
