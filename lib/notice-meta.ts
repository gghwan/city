import type { NoticeItem } from '@/types';

export type NoticeType = NoticeItem['noticeType'];

const EMERGENCY_PREFIX = '__EMERGENCY__::';

function stripKnownPrefixes(title: string) {
  if (title.startsWith(EMERGENCY_PREFIX)) {
    return title.slice(EMERGENCY_PREFIX.length);
  }
  return title;
}

export function normalizeNoticeType(value: unknown): NoticeType {
  return value === 'EMERGENCY' ? 'EMERGENCY' : 'GENERAL';
}

export function encodeNoticeTitle(rawTitle: string, noticeType: NoticeType) {
  const clean = stripKnownPrefixes(rawTitle).trim();
  if (noticeType === 'EMERGENCY') {
    return `${EMERGENCY_PREFIX}${clean}`;
  }
  return clean;
}

export function decodeNoticeTitle(storedTitle: string) {
  if (storedTitle.startsWith(EMERGENCY_PREFIX)) {
    return {
      title: storedTitle.slice(EMERGENCY_PREFIX.length),
      noticeType: 'EMERGENCY' as NoticeType,
    };
  }

  return {
    title: storedTitle,
    noticeType: 'GENERAL' as NoticeType,
  };
}

export function pickTopBannerNotice(notices: NoticeItem[]) {
  const pinned = notices.find((item) => item.isPinned);
  if (pinned) return pinned;

  const generalLatest = notices.find((item) => item.noticeType === 'GENERAL');
  if (generalLatest) return generalLatest;

  return notices[0] ?? null;
}

export function pickLatestEmergencyNotice(notices: NoticeItem[]) {
  return notices.find((item) => item.noticeType === 'EMERGENCY') ?? null;
}
