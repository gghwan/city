import { Bell, CalendarDays, FileText, Home, Map, MessageCircle, UserRound } from 'lucide-react';
import { MenuCard } from '@/components/dashboard/MenuCard';

const adminItems = [
  {
    href: '/service',
    title: '봉사 마련',
    description: '게스트 봉사 배정 및 회중 봉사 마련',
    icon: FileText,
    color: '#01696f',
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
  {
    href: '/schedule',
    title: '일정 캘린더',
    description: '날짜별 봉사 일정과 팀 배정 확인',
    icon: CalendarDays,
    color: '#0f7db3',
  },
];

const userItems = [
  {
    href: '/service',
    title: '봉사 안내',
    description: '비상 연락, 대화 방법, 봉사 마련을 한곳에서 확인',
    icon: FileText,
    color: '#01696f',
  },
  {
    href: '/schedule',
    title: '일정 캘린더',
    description: '날짜별 봉사 일정과 팀 배정 확인',
    icon: CalendarDays,
    color: '#0f7db3',
  },
  {
    href: '/card',
    title: '호별 카드',
    description: '서울풍납 회중 전자 구역 카드',
    icon: Home,
    color: '#437a22',
  },
  {
    href: '/map',
    title: '구역 지도',
    description: '한강공원, 올림픽공원, 아산병원',
    icon: Map,
    color: '#964219',
  },
  {
    href: '/talk',
    title: '대화 방법',
    description: '구역별 대화 방법 제안 자료',
    icon: MessageCircle,
    color: '#6b4ce6',
  },
  {
    href: '/mypage',
    title: '마이페이지',
    description: '내 신청 일정, 배정 현황, 문서 미리보기',
    icon: UserRound,
    color: '#d17b00',
  },
];

export function MenuGrid({ isAdmin }: { isAdmin: boolean }) {
  const visibleItems = isAdmin ? adminItems : userItems;

  return (
    <div className="grid grid-cols-2 gap-3">
      {visibleItems.map((item) => (
        <MenuCard key={item.href} {...item} />
      ))}
    </div>
  );
}
