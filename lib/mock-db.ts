import type { EmergencyContactItem, FileItem, LinkSet, NoticeItem } from '@/types';
import { DEFAULT_LINKS } from '@/lib/constants';

const nowIso = new Date().toISOString();

type MockState = {
  files: FileItem[];
  contacts: EmergencyContactItem[];
  links: LinkSet;
  notices: NoticeItem[];
  nextFileId: number;
  nextContactId: number;
  nextNoticeId: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __mockState: MockState | undefined;
}

function initState(): MockState {
  return {
    files: [
      {
        id: 1,
        type: 'SERVICE',
        name: '2026 캠페인 봉사 배정표',
        description: '서울풍납 회중 캠페인 기본 안내',
        storagePath: DEFAULT_LINKS.map,
        mimeType: 'application/pdf',
        sizeBytes: 1_200_000,
        createdAt: nowIso,
      },
      {
        id: 2,
        type: 'EMERGENCY',
        name: '비상 행동 요령 및 연락망',
        description: '긴급 대응 및 연락처 자료',
        storagePath: DEFAULT_LINKS.map,
        mimeType: 'application/pdf',
        sizeBytes: 800_000,
        createdAt: nowIso,
      },
    ],
    contacts: [
      {
        id: 1,
        name: '김주형',
        role: '캠페인 담당자',
        phone: '010-0000-0000',
        note: '캠페인 전체 총괄',
        sortOrder: 1,
        createdAt: nowIso,
      },
      {
        id: 2,
        name: '홍길동',
        role: '봉사 인도자',
        phone: '010-1111-2222',
        note: '한강공원 구역 담당',
        sortOrder: 2,
        createdAt: nowIso,
      },
    ],
    links: {
      map: DEFAULT_LINKS.map,
      card: DEFAULT_LINKS.card,
      talk: DEFAULT_LINKS.talk,
    },
    notices: [
      {
        id: 1,
        title: '2026 대도시 캠페인 안내',
        content: '봉사 마련 자료와 구역 지도를 확인하고, 비상 연락처를 저장해 주세요.',
        isPinned: true,
        createdAt: nowIso,
      },
    ],
    nextFileId: 3,
    nextContactId: 3,
    nextNoticeId: 2,
  };
}

export function getMockState() {
  if (!global.__mockState) {
    global.__mockState = initState();
  }
  return global.__mockState;
}
