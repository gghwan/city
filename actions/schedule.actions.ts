'use server';

import { revalidatePath } from 'next/cache';
import { AppError } from '@/lib/errors';
import { getMockState } from '@/lib/mock-db';
import { requireSession, withAdminAction } from '@/lib/with-admin';
import {
  applySlotSchema,
  cancelApplicationSchema,
  removeApplicationAsAdminSchema,
  assignApplicationSchema,
  directAssignSlotSchema,
  clearSlotSchema,
  addSlotSchema,
  deleteSlotSchema,
  updateSessionInfoSchema,
  updateSessionMemoSchema,
  updateGlobalNotesSchema,
  createScheduleDateSchema,
  deleteScheduleDateSchema,
  createScheduleSessionSchema,
  deleteScheduleSessionSchema,
  type ApplySlotDto,
  type CancelApplicationDto,
  type RemoveApplicationAsAdminDto,
  type AssignApplicationDto,
  type DirectAssignSlotDto,
  type ClearSlotDto,
  type AddSlotDto,
  type DeleteSlotDto,
  type UpdateSessionInfoDto,
  type UpdateSessionMemoDto,
  type UpdateGlobalNotesDto,
  type CreateScheduleDateDto,
  type DeleteScheduleDateDto,
  type CreateScheduleSessionDto,
  type DeleteScheduleSessionDto,
} from '@/lib/validations/schedule.schema';
import { loadSystemStateJson, saveSystemStateJson } from '@/lib/system-state';
import type {
  MyScheduleApplicationItem,
  ScheduleDateItem,
  ScheduleSessionKey,
  ScheduleSeedData,
  ScheduleSessionItem,
  ScheduleSlotItem,
  SlotApplicationItem,
} from '@/types';
import rawScheduleSeed from '@/data/campaign/schedule-2026-seed.json';
import rawUsers from '@/data/users-cleaned.json';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { isDatabaseConfigured, prisma } from '@/lib/prisma';

const useMockDb = process.env.USE_MOCK_DB === 'true';
const SCHEDULE_STATE_KEY = '__SYSTEM__SCHEDULE_STATE_V1';
const WEEK_DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

function getDateItem(schedule: ScheduleSeedData, date: string) {
  return schedule.dates.find((item) => item.date === date) ?? null;
}

function getSessionItem(dateItem: ScheduleDateItem, sessionKey: ScheduleSessionKey) {
  return dateItem.sessions.find((session) => session.key === sessionKey) ?? null;
}

function revalidateSchedulePaths(date: string, sessionKey?: ScheduleSessionKey) {
  revalidatePath('/schedule');
  revalidatePath(`/schedule/${date}`);
  if (sessionKey) {
    revalidatePath(`/schedule/${date}/${sessionKey.toLowerCase()}`);
  }
}

function getMemberSlots(sessionItem: ScheduleSessionItem): ScheduleSlotItem[] {
  return sessionItem.slots;
}

function normalizeAssignableName(name: string) {
  return name.replace(/관리자$/, '').trim();
}

function normalizeNameForMatch(value: string | null | undefined) {
  return normalizeAssignableName(String(value ?? ''));
}

function isSameAssignableName(left: string | null | undefined, right: string | null | undefined) {
  const leftNormalized = normalizeNameForMatch(left);
  const rightNormalized = normalizeNameForMatch(right);
  if (!leftNormalized || !rightNormalized) return false;
  return leftNormalized === rightNormalized;
}

function getWeekDayFromIso(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  const parsed = new Date(y, (m || 1) - 1, d || 1);
  return Number.isNaN(parsed.getTime()) ? '월' : WEEK_DAYS_KO[parsed.getDay()] ?? '월';
}

function normalizeSchedulePayload(seed: ScheduleSeedData): ScheduleSeedData {
  const normalized: ScheduleSeedData = {
    ...seed,
    guests: (seed.guests ?? []).map((guest) => ({ ...guest })),
    dates: (seed.dates ?? []).map((date) => ({
      ...date,
      day: date.day || getWeekDayFromIso(date.date),
      assignedGuestNos: [...(date.assignedGuestNos ?? [])],
      sessions: (date.sessions ?? []).map((session) => ({
        ...session,
        title: session.title ?? `${session.key === 'AM' ? '오전' : '오후'} 봉사`,
        adminMemo: session.adminMemo ?? null,
        slots: (session.slots ?? []).map((slot) => ({
          slotNo: slot.slotNo,
          status: slot.status,
          label: slot.label ?? null,
          memberName: normalizeNameForMatch(slot.memberName) || null,
          isLeaderSlot: false,
          applications: (slot.applications ?? []).map((application) => ({
            ...application,
            applicantName: normalizeNameForMatch(application.applicantName) || String(application.applicantName ?? ''),
            note: application.note ?? null,
          })),
        })),
      })),
    })),
    globalNotes: {
      ...seed.globalNotes,
      specialDuty: [...(seed.globalNotes?.specialDuty ?? [])],
    },
  };

  for (const date of normalized.dates) {
    for (const session of date.sessions) {
      if (session.leader === '구근희' || session.leader === '구근회') {
        session.leader = '구군회';
      }
      if (session.zone === '올공성내천') {
        session.zone = '올림픽공원 성내천';
      }
      refreshLeaderSlotFlags(session);
      session.slots.sort((a, b) => a.slotNo - b.slotNo);
    }
    date.sessions.sort((a, b) => (a.key === b.key ? 0 : a.key === 'AM' ? -1 : 1));
  }

  normalized.dates.sort((a, b) => a.date.localeCompare(b.date));
  return normalized;
}

function refreshLeaderSlotFlags(sessionItem: ScheduleSessionItem) {
  for (const slot of sessionItem.slots) {
    slot.isLeaderSlot = false;
  }
}

function hasLegacyLeaderSlotFlags(schedule: ScheduleSeedData) {
  return schedule.dates.some((dateItem) =>
    dateItem.sessions.some((sessionItem) => sessionItem.slots.some((slot) => slot.isLeaderSlot === true)),
  );
}

function buildDefaultSchedule(): ScheduleSeedData {
  return normalizeSchedulePayload(rawScheduleSeed as unknown as ScheduleSeedData);
}

function describeError(error: unknown) {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

async function loadScheduleStore(): Promise<ScheduleSeedData> {
  try {
    const state = await loadSystemStateJson<ScheduleSeedData>(SCHEDULE_STATE_KEY, buildDefaultSchedule);
    const normalized = normalizeSchedulePayload(state);
    if (hasLegacyLeaderSlotFlags(state)) {
      await saveSystemStateJson(SCHEDULE_STATE_KEY, normalized);
    }
    return normalized;
  } catch (error) {
    if (!useMockDb) {
      throw new AppError('E009', `일정 데이터를 DB에서 읽지 못했습니다. ${describeError(error)}`, 503);
    }

    const mock = getMockState();
    console.warn('[schedule.actions] DB 조회 실패, mock 상태로 폴백합니다:', error);
    return normalizeSchedulePayload(structuredClone(mock.schedule));
  }
}

async function saveScheduleStore(schedule: ScheduleSeedData): Promise<void> {
  const normalized = normalizeSchedulePayload(schedule);

  try {
    await saveSystemStateJson(SCHEDULE_STATE_KEY, normalized);
    return;
  } catch (error) {
    if (!useMockDb) {
      throw new AppError('E009', `일정 데이터를 DB에 저장하지 못했습니다. ${describeError(error)}`, 503);
    }

    const mock = getMockState();
    mock.schedule = structuredClone(normalized);
    console.warn('[schedule.actions] DB 저장 실패, mock 상태로 폴백합니다:', error);
  }
}

export async function getScheduleSeedData(): Promise<ScheduleSeedData> {
  return loadScheduleStore();
}

export async function getScheduleDate(date: string): Promise<ScheduleDateItem | null> {
  const schedule = await loadScheduleStore();
  const dateItem = getDateItem(schedule, date);
  return dateItem ? structuredClone(dateItem) : null;
}

export async function getScheduleSession(date: string, sessionKey: ScheduleSessionKey): Promise<ScheduleSessionItem | null> {
  const schedule = await loadScheduleStore();
  const dateItem = getDateItem(schedule, date);
  if (!dateItem) return null;
  const session = getSessionItem(dateItem, sessionKey);
  return session ? structuredClone(session) : null;
}

export async function getAssignableUsernamesForAdmin(): Promise<string[]> {
  return withAdminAction(async () => {
    const nameSet = new Set<string>();

    for (const row of rawUsers as Array<{ username?: string }>) {
      const normalized = normalizeAssignableName(String(row?.username ?? ''));
      if (normalized) nameSet.add(normalized);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.from('User').select('username').order('username', { ascending: true });
        if (!error && data) {
          for (const row of data as Array<{ username: string }>) {
            const normalized = normalizeAssignableName(row.username);
            if (normalized) nameSet.add(normalized);
          }
        }
      } catch (error) {
        console.warn('[schedule.actions] Supabase 사용자 목록 조회 실패:', error);
      }
    }

    if (isDatabaseConfigured) {
      try {
        const users = await prisma.user.findMany({
          select: { username: true },
          orderBy: { username: 'asc' },
        });
        for (const user of users) {
          const normalized = normalizeAssignableName(user.username);
          if (normalized) nameSet.add(normalized);
        }
      } catch (error) {
        console.warn('[schedule.actions] Prisma 사용자 목록 조회 실패:', error);
      }
    }

    const schedule = await loadScheduleStore();
    for (const dateItem of schedule.dates) {
      for (const sessionItem of dateItem.sessions) {
        const leaderName = normalizeAssignableName(sessionItem.leader ?? '');
        if (leaderName) nameSet.add(leaderName);
        for (const slot of sessionItem.slots) {
          const memberName = normalizeAssignableName(slot.memberName ?? '');
          if (memberName) nameSet.add(memberName);
          for (const app of slot.applications) {
            const applicantName = normalizeAssignableName(app.applicantName ?? '');
            if (applicantName) nameSet.add(applicantName);
          }
        }
      }
    }

    return [...nameSet].sort((a, b) => a.localeCompare(b, 'ko'));
  });
}

export async function getMyScheduleApplications(): Promise<MyScheduleApplicationItem[]> {
  const session = await requireSession();
  const schedule = await loadScheduleStore();
  const currentName = normalizeNameForMatch(session.user.username);

  const itemMap = new Map<string, MyScheduleApplicationItem>();

  for (const dateItem of schedule.dates) {
    for (const sessionItem of dateItem.sessions) {
      for (const slot of getMemberSlots(sessionItem)) {
        const app = slot.applications.find(
          (entry) => entry.applicantId === session.user.id || isSameAssignableName(entry.applicantName, currentName),
        );
        const key = `${dateItem.date}-${sessionItem.key}-${String(slot.slotNo).padStart(3, '0')}`;
        if (app) {
          itemMap.set(key, {
            date: dateItem.date,
            day: dateItem.day,
            sessionKey: sessionItem.key,
            time: sessionItem.time,
            zone: sessionItem.zone,
            slotNo: slot.slotNo,
            status: 'pending',
            submittedAt: app.submittedAt,
          });
          continue;
        }

        if (isSameAssignableName(slot.memberName, currentName)) {
          const previous = itemMap.get(key);
          itemMap.set(key, {
            date: dateItem.date,
            day: dateItem.day,
            sessionKey: sessionItem.key,
            time: sessionItem.time,
            zone: sessionItem.zone,
            slotNo: slot.slotNo,
            status: 'assigned',
            submittedAt: previous?.submittedAt ?? `${dateItem.date}T00:00:00+09:00`,
          });
        }
      }
    }
  }

  return [...itemMap.values()].sort((a, b) => {
    const keyA = `${a.date}-${a.sessionKey}-${String(a.slotNo).padStart(3, '0')}`;
    const keyB = `${b.date}-${b.sessionKey}-${String(b.slotNo).padStart(3, '0')}`;
    return keyA.localeCompare(keyB);
  });
}

export async function applySlot(dto: ApplySlotDto): Promise<SlotApplicationItem> {
  const session = await requireSession();
  const currentName = normalizeNameForMatch(session.user.username);
  const parsed = applySlotSchema.safeParse(dto);
  if (!parsed.success) {
    throw new AppError('E007', '입력값을 확인해주세요.', 422);
  }

  const schedule = await loadScheduleStore();
  const dateItem = getDateItem(schedule, parsed.data.date);
  if (!dateItem) {
    throw new AppError('E004', '해당 날짜 일정을 찾을 수 없습니다.', 404);
  }

  const sessionItem = getSessionItem(dateItem, parsed.data.sessionKey);
  if (!sessionItem) {
    throw new AppError('E004', '해당 시간대 일정을 찾을 수 없습니다.', 404);
  }

  const targetSlot = sessionItem.slots.find((slot) => slot.slotNo === parsed.data.slotNo);
  if (!targetSlot) {
    throw new AppError('E004', '해당 슬롯을 찾을 수 없습니다.', 404);
  }

  if (targetSlot.status !== 'open') {
    throw new AppError('E010', '신청 가능한 슬롯이 아닙니다.', 409);
  }

  const alreadyAppliedInSession = getMemberSlots(sessionItem).some((slot) =>
    slot.applications.some(
      (entry) => entry.applicantId === session.user.id || isSameAssignableName(entry.applicantName, currentName),
    ),
  );
  if (alreadyAppliedInSession) {
    throw new AppError('E010', '이미 같은 시간대에 신청되어 있습니다.', 409);
  }

  const alreadyAssignedInSession = getMemberSlots(sessionItem).some((slot) => isSameAssignableName(slot.memberName, currentName));
  if (alreadyAssignedInSession) {
    throw new AppError('E010', '이미 같은 시간대에 배정되어 있습니다.', 409);
  }

  const created: SlotApplicationItem = {
    applicationId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    applicantId: session.user.id,
    applicantName: session.user.username,
    submittedAt: new Date().toISOString(),
    note: parsed.data.note?.trim() || null,
  };

  targetSlot.applications.push(created);
  await saveScheduleStore(schedule);
  revalidateSchedulePaths(parsed.data.date, parsed.data.sessionKey);
  return created;
}

export async function applySlotAction(formData: FormData) {
  await applySlot({
    date: String(formData.get('date') || ''),
    sessionKey: String(formData.get('sessionKey') || '') as 'AM' | 'PM',
    slotNo: Number(formData.get('slotNo')),
    note: String(formData.get('note') || ''),
  });
}

export async function cancelApplication(dto: CancelApplicationDto): Promise<void> {
  const session = await requireSession();
  const parsed = cancelApplicationSchema.safeParse(dto);
  if (!parsed.success) {
    throw new AppError('E007', '입력값을 확인해주세요.', 422);
  }

  const schedule = await loadScheduleStore();
  const dateItem = getDateItem(schedule, parsed.data.date);
  if (!dateItem) {
    throw new AppError('E004', '해당 날짜 일정을 찾을 수 없습니다.', 404);
  }

  const sessionItem = getSessionItem(dateItem, parsed.data.sessionKey);
  if (!sessionItem) {
    throw new AppError('E004', '해당 시간대 일정을 찾을 수 없습니다.', 404);
  }

  for (const slot of getMemberSlots(sessionItem)) {
    const appIndex = slot.applications.findIndex((entry) => entry.applicationId === parsed.data.applicationId);
    if (appIndex < 0) continue;

    const target = slot.applications[appIndex];
    if (target.applicantId !== session.user.id) {
      throw new AppError('E003', '본인 신청만 취소할 수 있습니다.', 403);
    }

    slot.applications.splice(appIndex, 1);
    await saveScheduleStore(schedule);
    revalidateSchedulePaths(parsed.data.date, parsed.data.sessionKey);
    return;
  }

  throw new AppError('E004', '취소할 신청 정보를 찾을 수 없습니다.', 404);
}

export async function cancelApplicationAction(formData: FormData) {
  await cancelApplication({
    date: String(formData.get('date') || ''),
    sessionKey: String(formData.get('sessionKey') || '') as 'AM' | 'PM',
    applicationId: String(formData.get('applicationId') || ''),
  });
}

export async function removeApplicationAsAdmin(dto: RemoveApplicationAsAdminDto): Promise<void> {
  await withAdminAction(async () => {
    const parsed = removeApplicationAsAdminSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    const schedule = await loadScheduleStore();
    const dateItem = getDateItem(schedule, parsed.data.date);
    if (!dateItem) {
      throw new AppError('E004', '해당 날짜 일정을 찾을 수 없습니다.', 404);
    }

    const sessionItem = getSessionItem(dateItem, parsed.data.sessionKey);
    if (!sessionItem) {
      throw new AppError('E004', '해당 시간대 일정을 찾을 수 없습니다.', 404);
    }

    for (const slot of getMemberSlots(sessionItem)) {
      const before = slot.applications.length;
      slot.applications = slot.applications.filter((entry) => entry.applicationId !== parsed.data.applicationId);
      if (slot.applications.length !== before) {
        await saveScheduleStore(schedule);
        revalidateSchedulePaths(parsed.data.date, parsed.data.sessionKey);
        return;
      }
    }

    throw new AppError('E004', '취소할 신청 정보를 찾을 수 없습니다.', 404);
  });
}

export async function removeApplicationAsAdminAction(formData: FormData) {
  await removeApplicationAsAdmin({
    date: String(formData.get('date') || ''),
    sessionKey: String(formData.get('sessionKey') || '') as 'AM' | 'PM',
    applicationId: String(formData.get('applicationId') || ''),
  });
}

export async function assignApplication(dto: AssignApplicationDto): Promise<void> {
  await withAdminAction(async () => {
    const parsed = assignApplicationSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    const schedule = await loadScheduleStore();
    const dateItem = getDateItem(schedule, parsed.data.date);
    if (!dateItem) {
      throw new AppError('E004', '해당 날짜 일정을 찾을 수 없습니다.', 404);
    }

    const sessionItem = getSessionItem(dateItem, parsed.data.sessionKey);
    if (!sessionItem) {
      throw new AppError('E004', '해당 시간대 일정을 찾을 수 없습니다.', 404);
    }

    const targetSlot = sessionItem.slots.find((slot) => slot.slotNo === parsed.data.slotNo);
    if (!targetSlot) {
      throw new AppError('E004', '대상 슬롯을 찾을 수 없습니다.', 404);
    }

    if (targetSlot.status !== 'open') {
      throw new AppError('E010', '이미 배정된 슬롯입니다.', 409);
    }

    let foundApplication: SlotApplicationItem | null = null;

    for (const slot of getMemberSlots(sessionItem)) {
      const app = slot.applications.find((entry) => entry.applicationId === parsed.data.applicationId);
      if (!app) continue;
      foundApplication = app;
      break;
    }

    if (!foundApplication) {
      throw new AppError('E004', '신청 정보를 찾을 수 없습니다.', 404);
    }

    const duplicateAssigned = getMemberSlots(sessionItem).some((slot) =>
      isSameAssignableName(slot.memberName, foundApplication!.applicantName),
    );
    if (duplicateAssigned) {
      throw new AppError('E010', '이미 같은 시간대에 배정된 사용자입니다.', 409);
    }

    targetSlot.status = 'assigned';
    targetSlot.memberName = foundApplication.applicantName;
    if (!targetSlot.label) {
      targetSlot.label = `${targetSlot.slotNo} 배정완료`;
    }

    for (const slot of getMemberSlots(sessionItem)) {
      slot.applications = slot.applications.filter(
        (entry) =>
          entry.applicantId !== foundApplication!.applicantId &&
          !isSameAssignableName(entry.applicantName, foundApplication!.applicantName),
      );
    }

    await saveScheduleStore(schedule);
    revalidateSchedulePaths(parsed.data.date, parsed.data.sessionKey);
  });
}

export async function assignApplicationAction(formData: FormData) {
  await assignApplication({
    date: String(formData.get('date') || ''),
    sessionKey: String(formData.get('sessionKey') || '') as 'AM' | 'PM',
    slotNo: Number(formData.get('slotNo')),
    applicationId: String(formData.get('applicationId') || ''),
  });
}

export async function directAssignSlot(dto: DirectAssignSlotDto): Promise<void> {
  await withAdminAction(async () => {
    const parsed = directAssignSlotSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    const schedule = await loadScheduleStore();
    const dateItem = getDateItem(schedule, parsed.data.date);
    if (!dateItem) {
      throw new AppError('E004', '해당 날짜 일정을 찾을 수 없습니다.', 404);
    }

    const sessionItem = getSessionItem(dateItem, parsed.data.sessionKey);
    if (!sessionItem) {
      throw new AppError('E004', '해당 시간대 일정을 찾을 수 없습니다.', 404);
    }

    const targetSlot = sessionItem.slots.find((slot) => slot.slotNo === parsed.data.slotNo);
    if (!targetSlot) {
      throw new AppError('E004', '대상 슬롯을 찾을 수 없습니다.', 404);
    }

    const memberName = normalizeAssignableName(parsed.data.memberName);
    if (!memberName) {
      throw new AppError('E007', '배정할 이름을 입력해주세요.', 422);
    }

    const assignable = await getAssignableUsernamesForAdmin();
    if (!assignable.includes(memberName)) {
      throw new AppError('E004', '유저 테이블에 없는 이름입니다. 등록된 사용자만 직접 배정할 수 있습니다.', 404);
    }

    const duplicateAssigned = getMemberSlots(sessionItem).some(
      (slot) => slot.slotNo !== targetSlot.slotNo && isSameAssignableName(slot.memberName, memberName),
    );
    if (duplicateAssigned) {
      throw new AppError('E010', '이미 같은 시간대에 배정된 사용자입니다.', 409);
    }

    targetSlot.status = 'assigned';
    targetSlot.memberName = memberName;
    targetSlot.label = `${targetSlot.slotNo} 배정완료`;

    for (const slot of getMemberSlots(sessionItem)) {
      slot.applications = slot.applications.filter((entry) => !isSameAssignableName(entry.applicantName, memberName));
    }

    await saveScheduleStore(schedule);
    revalidateSchedulePaths(parsed.data.date, parsed.data.sessionKey);
  });
}

export async function directAssignSlotAction(formData: FormData) {
  await directAssignSlot({
    date: String(formData.get('date') || ''),
    sessionKey: String(formData.get('sessionKey') || '') as 'AM' | 'PM',
    slotNo: Number(formData.get('slotNo')),
    memberName: String(formData.get('memberName') || ''),
  });
}

export async function clearSlot(dto: ClearSlotDto): Promise<void> {
  await withAdminAction(async () => {
    const parsed = clearSlotSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    const schedule = await loadScheduleStore();
    const dateItem = getDateItem(schedule, parsed.data.date);
    if (!dateItem) {
      throw new AppError('E004', '해당 날짜 일정을 찾을 수 없습니다.', 404);
    }

    const sessionItem = getSessionItem(dateItem, parsed.data.sessionKey);
    if (!sessionItem) {
      throw new AppError('E004', '해당 시간대 일정을 찾을 수 없습니다.', 404);
    }

    const targetSlot = sessionItem.slots.find((slot) => slot.slotNo === parsed.data.slotNo);
    if (!targetSlot) {
      throw new AppError('E004', '대상 슬롯을 찾을 수 없습니다.', 404);
    }

    targetSlot.status = 'open';
    targetSlot.memberName = null;
    targetSlot.label = `${targetSlot.slotNo} (봉사신청가능)`;

    await saveScheduleStore(schedule);
    revalidateSchedulePaths(parsed.data.date, parsed.data.sessionKey);
  });
}

export async function clearSlotAction(formData: FormData) {
  await clearSlot({
    date: String(formData.get('date') || ''),
    sessionKey: String(formData.get('sessionKey') || '') as 'AM' | 'PM',
    slotNo: Number(formData.get('slotNo')),
  });
}

export async function addSlot(dto: AddSlotDto): Promise<void> {
  await withAdminAction(async () => {
    const parsed = addSlotSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    const schedule = await loadScheduleStore();
    const dateItem = getDateItem(schedule, parsed.data.date);
    if (!dateItem) {
      throw new AppError('E004', '해당 날짜 일정을 찾을 수 없습니다.', 404);
    }

    const sessionItem = getSessionItem(dateItem, parsed.data.sessionKey);
    if (!sessionItem) {
      throw new AppError('E004', '해당 시간대 일정을 찾을 수 없습니다.', 404);
    }

    const nextNo = sessionItem.slots.reduce((max, slot) => Math.max(max, slot.slotNo), 0) + 1;
    sessionItem.slots.push({
      slotNo: nextNo,
      status: 'open',
      label: `${nextNo} (봉사신청가능)`,
      memberName: null,
      isLeaderSlot: false,
      applications: [],
    });
    sessionItem.slots.sort((a, b) => a.slotNo - b.slotNo);

    await saveScheduleStore(schedule);
    revalidateSchedulePaths(parsed.data.date, parsed.data.sessionKey);
  });
}

export async function addSlotAction(formData: FormData) {
  await addSlot({
    date: String(formData.get('date') || ''),
    sessionKey: String(formData.get('sessionKey') || '') as 'AM' | 'PM',
  });
}

export async function deleteSlot(dto: DeleteSlotDto): Promise<void> {
  await withAdminAction(async () => {
    const parsed = deleteSlotSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    const schedule = await loadScheduleStore();
    const dateItem = getDateItem(schedule, parsed.data.date);
    if (!dateItem) {
      throw new AppError('E004', '해당 날짜 일정을 찾을 수 없습니다.', 404);
    }

    const sessionItem = getSessionItem(dateItem, parsed.data.sessionKey);
    if (!sessionItem) {
      throw new AppError('E004', '해당 시간대 일정을 찾을 수 없습니다.', 404);
    }

    const index = sessionItem.slots.findIndex((slot) => slot.slotNo === parsed.data.slotNo);
    if (index < 0) {
      throw new AppError('E004', '삭제할 슬롯을 찾을 수 없습니다.', 404);
    }

    const target = sessionItem.slots[index];
    if (target.status !== 'open' || target.memberName) {
      throw new AppError('E010', '배정된 슬롯은 삭제할 수 없습니다. 먼저 신청가능으로 변경해 주세요.', 409);
    }
    if (target.applications.length > 0) {
      throw new AppError('E010', '신청 대기자가 있는 슬롯은 삭제할 수 없습니다.', 409);
    }

    sessionItem.slots.splice(index, 1);
    await saveScheduleStore(schedule);
    revalidateSchedulePaths(parsed.data.date, parsed.data.sessionKey);
  });
}

export async function deleteSlotAction(formData: FormData) {
  await deleteSlot({
    date: String(formData.get('date') || ''),
    sessionKey: String(formData.get('sessionKey') || '') as 'AM' | 'PM',
    slotNo: Number(formData.get('slotNo')),
  });
}

export async function updateSessionMemo(dto: UpdateSessionMemoDto): Promise<void> {
  await withAdminAction(async () => {
    const parsed = updateSessionMemoSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    const schedule = await loadScheduleStore();
    const dateItem = getDateItem(schedule, parsed.data.date);
    if (!dateItem) {
      throw new AppError('E004', '해당 날짜 일정을 찾을 수 없습니다.', 404);
    }

    const sessionItem = getSessionItem(dateItem, parsed.data.sessionKey);
    if (!sessionItem) {
      throw new AppError('E004', '해당 시간대 일정을 찾을 수 없습니다.', 404);
    }

    sessionItem.adminMemo = parsed.data.memo.trim() || null;
    await saveScheduleStore(schedule);
    revalidateSchedulePaths(parsed.data.date, parsed.data.sessionKey);
  });
}

export async function updateSessionMemoAction(formData: FormData) {
  await updateSessionMemo({
    date: String(formData.get('date') || ''),
    sessionKey: String(formData.get('sessionKey') || '') as 'AM' | 'PM',
    memo: String(formData.get('memo') || ''),
  });
}

export async function updateGlobalNotes(dto: UpdateGlobalNotesDto): Promise<void> {
  await withAdminAction(async () => {
    const parsed = updateGlobalNotesSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    const schedule = await loadScheduleStore();
    const lines = parsed.data.notes
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    schedule.globalNotes = {
      applyContact: lines[0] ?? '',
      meetingPlace: lines[1] ?? '',
      specialDuty: lines.slice(2),
    };

    await saveScheduleStore(schedule);
    revalidatePath('/schedule');
  });
}

export async function updateGlobalNotesAction(formData: FormData) {
  const rawLines = String(formData.get('notes') || '');
  await updateGlobalNotes({
    notes: rawLines
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
  });
}

export async function updateSessionInfo(dto: UpdateSessionInfoDto): Promise<void> {
  await withAdminAction(async () => {
    const parsed = updateSessionInfoSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    const schedule = await loadScheduleStore();
    const dateItem = getDateItem(schedule, parsed.data.date);
    if (!dateItem) {
      throw new AppError('E004', '해당 날짜 일정을 찾을 수 없습니다.', 404);
    }

    const sessionItem = getSessionItem(dateItem, parsed.data.sessionKey);
    if (!sessionItem) {
      throw new AppError('E004', '해당 시간대 일정을 찾을 수 없습니다.', 404);
    }

    sessionItem.leader = parsed.data.leader.trim();
    sessionItem.time = parsed.data.time.trim();
    sessionItem.zone = parsed.data.zone.trim();
    refreshLeaderSlotFlags(sessionItem);

    await saveScheduleStore(schedule);
    revalidateSchedulePaths(parsed.data.date, parsed.data.sessionKey);
  });
}

export async function updateSessionInfoAction(formData: FormData) {
  await updateSessionInfo({
    date: String(formData.get('date') || ''),
    sessionKey: String(formData.get('sessionKey') || '') as 'AM' | 'PM',
    time: String(formData.get('time') || ''),
    leader: String(formData.get('leader') || ''),
    zone: String(formData.get('zone') || ''),
  });
}

export async function createScheduleDate(dto: CreateScheduleDateDto): Promise<void> {
  await withAdminAction(async () => {
    const parsed = createScheduleDateSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    const schedule = await loadScheduleStore();
    if (getDateItem(schedule, parsed.data.date)) {
      throw new AppError('E010', '이미 등록된 날짜입니다.', 409);
    }

    schedule.dates.push({
      date: parsed.data.date,
      day: getWeekDayFromIso(parsed.data.date),
      assignedGuestNos: [],
      circuitServiceZoom: false,
      sessions: [],
    });
    schedule.dates.sort((a, b) => a.date.localeCompare(b.date));

    await saveScheduleStore(schedule);
    revalidatePath('/schedule');
  });
}

export async function createScheduleDateAction(formData: FormData) {
  await createScheduleDate({
    date: String(formData.get('date') || ''),
  });
}

export async function deleteScheduleDate(dto: DeleteScheduleDateDto): Promise<void> {
  await withAdminAction(async () => {
    const parsed = deleteScheduleDateSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    const schedule = await loadScheduleStore();
    const index = schedule.dates.findIndex((item) => item.date === parsed.data.date);
    if (index < 0) {
      throw new AppError('E004', '삭제할 날짜를 찾을 수 없습니다.', 404);
    }

    schedule.dates.splice(index, 1);
    await saveScheduleStore(schedule);
    revalidatePath('/schedule');
    revalidatePath(`/schedule/${parsed.data.date}`);
  });
}

export async function deleteScheduleDateAction(formData: FormData) {
  await deleteScheduleDate({
    date: String(formData.get('date') || ''),
  });
}

export async function createScheduleSession(dto: CreateScheduleSessionDto): Promise<void> {
  await withAdminAction(async () => {
    const parsed = createScheduleSessionSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    const schedule = await loadScheduleStore();
    const dateItem = getDateItem(schedule, parsed.data.date);
    if (!dateItem) {
      throw new AppError('E004', '해당 날짜 일정을 찾을 수 없습니다.', 404);
    }

    if (getSessionItem(dateItem, parsed.data.sessionKey)) {
      throw new AppError('E010', '이미 존재하는 세션입니다.', 409);
    }

    const nextSlotNo = 1;
    const leader = parsed.data.leader?.trim() ?? '';

    const session: ScheduleSessionItem = {
      key: parsed.data.sessionKey,
      title: parsed.data.title?.trim() || `${parsed.data.sessionKey === 'AM' ? '오전' : '오후'} 봉사`,
      time: parsed.data.time.trim(),
      zone: parsed.data.zone.trim(),
      leader,
      adminMemo: null,
      slots: [
        {
          slotNo: nextSlotNo,
          status: 'open',
          label: `${nextSlotNo} (봉사신청가능)`,
          memberName: null,
          isLeaderSlot: false,
          applications: [],
        },
      ],
    };

    refreshLeaderSlotFlags(session);

    dateItem.sessions.push(session);
    dateItem.sessions.sort((a, b) => (a.key === b.key ? 0 : a.key === 'AM' ? -1 : 1));

    await saveScheduleStore(schedule);
    revalidateSchedulePaths(parsed.data.date, parsed.data.sessionKey);
  });
}

export async function createScheduleSessionAction(formData: FormData) {
  await createScheduleSession({
    date: String(formData.get('date') || ''),
    sessionKey: String(formData.get('sessionKey') || '') as 'AM' | 'PM',
    title: String(formData.get('title') || ''),
    time: String(formData.get('time') || ''),
    zone: String(formData.get('zone') || ''),
    leader: String(formData.get('leader') || ''),
  });
}

export async function deleteScheduleSession(dto: DeleteScheduleSessionDto): Promise<void> {
  await withAdminAction(async () => {
    const parsed = deleteScheduleSessionSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    const schedule = await loadScheduleStore();
    const dateItem = getDateItem(schedule, parsed.data.date);
    if (!dateItem) {
      throw new AppError('E004', '해당 날짜 일정을 찾을 수 없습니다.', 404);
    }

    const index = dateItem.sessions.findIndex((item) => item.key === parsed.data.sessionKey);
    if (index < 0) {
      throw new AppError('E004', '삭제할 세션을 찾을 수 없습니다.', 404);
    }

    dateItem.sessions.splice(index, 1);

    await saveScheduleStore(schedule);
    revalidateSchedulePaths(parsed.data.date, parsed.data.sessionKey);
  });
}

export async function deleteScheduleSessionAction(formData: FormData) {
  await deleteScheduleSession({
    date: String(formData.get('date') || ''),
    sessionKey: String(formData.get('sessionKey') || '') as 'AM' | 'PM',
  });
}
