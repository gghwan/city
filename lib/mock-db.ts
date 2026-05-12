import type {
  EmergencyContactItem,
  FileItem,
  LinkSet,
  NoticeItem,
  ScheduleSeedData,
  ServiceReportItem,
} from '@/types';
import { DEFAULT_LINKS } from '@/lib/constants';
import rawScheduleSeed from '@/data/campaign/schedule-2026-seed.json';

const nowIso = new Date().toISOString();

type MockState = {
  files: FileItem[];
  contacts: EmergencyContactItem[];
  links: LinkSet;
  notices: NoticeItem[];
  schedule: ScheduleSeedData;
  reports: ServiceReportItem[];
  nextFileId: number;
  nextContactId: number;
  nextNoticeId: number;
  nextReportId: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __mockState: MockState | undefined;
}

function initState(): MockState {
  const schedule = normalizeScheduleSeed(rawScheduleSeed as unknown as ScheduleSeedData);

  return {
    files: [
      {
        id: 1,
        type: 'SERVICE',
        name: '2026 캠페인 봉사 배정표',
        description: '서울풍납 회중 캠페인 기본 안내',
        storagePath: '/documents/service-plan-sample.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1_200_000,
        createdAt: nowIso,
      },
      {
        id: 2,
        type: 'EMERGENCY',
        name: '비상 행동 요령 및 연락망',
        description: '긴급 대응 및 연락처 자료',
        storagePath: '/documents/emergency-guide-sample.pdf',
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
      map: { url: DEFAULT_LINKS.map, updatedAt: nowIso },
      card: { url: DEFAULT_LINKS.card, updatedAt: nowIso },
      talk: { url: DEFAULT_LINKS.talk, updatedAt: null },
    },
    notices: [
      {
        id: 1,
        title: '2026 대도시 캠페인 안내',
        content: '봉사 마련 자료와 구역 지도를 확인하고, 비상 연락처를 저장해 주세요.',
        isPinned: true,
        noticeType: 'GENERAL',
        createdAt: nowIso,
      },
    ],
    schedule,
    reports: [],
    nextFileId: 3,
    nextContactId: 3,
    nextNoticeId: 2,
    nextReportId: 1,
  };
}

export function getMockState() {
  if (!global.__mockState) {
    global.__mockState = initState();
  }
  normalizeLegacyFilePaths(global.__mockState);
  normalizeLegacyScheduleLabels(global.__mockState);
  return global.__mockState;
}

function normalizeLegacyFilePaths(state: MockState) {
  for (const file of state.files) {
    if (
      file.type === 'SERVICE' &&
      (file.storagePath === DEFAULT_LINKS.map || file.storagePath.includes('google.com/maps'))
    ) {
      file.storagePath = '/documents/service-plan-sample.pdf';
      file.mimeType = 'application/pdf';
    }
    if (
      file.type === 'EMERGENCY' &&
      (file.storagePath === DEFAULT_LINKS.map || file.storagePath.includes('google.com/maps'))
    ) {
      file.storagePath = '/documents/emergency-guide-sample.pdf';
      file.mimeType = 'application/pdf';
    }
  }
}

function normalizeLegacyScheduleLabels(state: MockState) {
  for (const date of state.schedule.dates) {
    for (const session of date.sessions) {
      if (session.leader === '구근희' || session.leader === '구근회') {
        session.leader = '구군회';
      }
      if (session.zone === '올공성내천') {
        session.zone = '올림픽공원 성내천';
      }
      for (const slot of session.slots) {
        slot.isLeaderSlot = false;
      }
    }
  }
}

function normalizeScheduleSeed(seed: ScheduleSeedData): ScheduleSeedData {
  return {
    ...seed,
    guests: (seed.guests ?? []).map((guest) => ({ ...guest })),
    dates: seed.dates.map((date) => ({
      ...date,
      assignedGuestNos: [...date.assignedGuestNos],
      sessions: date.sessions.map((session) => ({
        ...session,
        title: session.title ?? `${session.key === 'AM' ? '오전' : '오후'} 봉사`,
        adminMemo: session.adminMemo ?? null,
        slots: session.slots.map((slot) => ({
          slotNo: slot.slotNo,
          status: slot.status,
          label: slot.label ?? null,
          memberName: slot.memberName ?? null,
          isLeaderSlot: false,
          applications: (slot.applications ?? []).map((application) => ({
            ...application,
            note: application.note ?? null,
          })),
        })),
      })),
    })),
    globalNotes: {
      ...seed.globalNotes,
      specialDuty: [...seed.globalNotes.specialDuty],
    },
  };
}
