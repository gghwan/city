'use server';

import { revalidatePath } from 'next/cache';
import { AppError } from '@/lib/errors';
import { getMockState } from '@/lib/mock-db';
import { requireSession, withAdminAction } from '@/lib/with-admin';
import { upsertReportSchema, type UpsertReportDto } from '@/lib/validations/report.schema';
import type { ServiceReportItem, ServiceReportStatus } from '@/types';
import { loadSystemStateJson, saveSystemStateJson } from '@/lib/system-state';

const useMockDb = process.env.USE_MOCK_DB === 'true';
const REPORTS_STATE_KEY = '__SYSTEM__REPORTS_STATE_V1';

type ReportStorePayload = {
  nextId: number;
  items: ServiceReportItem[];
};

function cloneReport(report: ServiceReportItem): ServiceReportItem {
  return { ...report };
}

function sortReportsDesc(a: ServiceReportItem, b: ServiceReportItem) {
  const keyA = `${a.reportDate}-${a.updatedAt}`;
  const keyB = `${b.reportDate}-${b.updatedAt}`;
  return keyB.localeCompare(keyA);
}

function parseStatus(value: FormDataEntryValue | null): ServiceReportStatus {
  if (value === 'DRAFT') return 'DRAFT';
  return 'SUBMITTED';
}

function normalizeReport(raw: ServiceReportItem): ServiceReportItem {
  return {
    id: Number(raw.id),
    reporterId: String(raw.reporterId || ''),
    reporterName: String(raw.reporterName || ''),
    reportDate: String(raw.reportDate || ''),
    status: raw.status === 'DRAFT' ? 'DRAFT' : 'SUBMITTED',
    ministryType: raw.ministryType === 'SUBWAY' ? 'SUBWAY' : 'CIRCUIT',
    revisitCount: Number(raw.revisitCount || 0),
    contactExchangeCount: Number(raw.contactExchangeCount || 0),
    visitRequestCount: Number(raw.visitRequestCount || 0),
    bibleStudyProposalCount: Number(raw.bibleStudyProposalCount || 0),
    bibleStudyStartCount: Number(raw.bibleStudyStartCount || 0),
    subwayShift: raw.subwayShift === 'AM' || raw.subwayShift === 'PM' ? raw.subwayShift : '',
    subwayLocation: String(raw.subwayLocation || ''),
    magazineCount: Number(raw.magazineCount || 0),
    brochureCount: Number(raw.brochureCount || 0),
    subwayVisitRequestCount: Number(raw.subwayVisitRequestCount || 0),
    notes: String(raw.notes || ''),
    experienceServiceType: String(raw.experienceServiceType || ''),
    experienceType: String(raw.experienceType || ''),
    experienceContent: String(raw.experienceContent || ''),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
  };
}

function normalizeReportStore(raw: ReportStorePayload): ReportStorePayload {
  const items = (raw.items ?? []).map(normalizeReport);
  const maxId = items.reduce((max, item) => Math.max(max, item.id), 0);
  const nextId = Math.max(Number(raw.nextId || 1), maxId + 1);

  return {
    nextId,
    items,
  };
}

function createEmptyReportStore(): ReportStorePayload {
  return {
    nextId: 1,
    items: [],
  };
}

function describeError(error: unknown) {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

async function loadReportStore(): Promise<ReportStorePayload> {
  try {
    const store = await loadSystemStateJson<ReportStorePayload>(REPORTS_STATE_KEY, createEmptyReportStore);
    return normalizeReportStore(store);
  } catch (error) {
    if (!useMockDb) {
      throw new AppError('E009', `보고 데이터를 DB에서 읽지 못했습니다. ${describeError(error)}`, 503);
    }

    const mock = getMockState();
    const items = mock.reports.map(cloneReport);
    return normalizeReportStore({
      nextId: mock.nextReportId,
      items,
    });
  }
}

async function saveReportStore(store: ReportStorePayload): Promise<void> {
  const normalized = normalizeReportStore(store);

  try {
    await saveSystemStateJson(REPORTS_STATE_KEY, normalized);
    return;
  } catch (error) {
    if (!useMockDb) {
      throw new AppError('E009', `보고 데이터를 DB에 저장하지 못했습니다. ${describeError(error)}`, 503);
    }

    const mock = getMockState();
    mock.reports = normalized.items.map(cloneReport);
    mock.nextReportId = normalized.nextId;
  }
}

export async function getMyReports(): Promise<ServiceReportItem[]> {
  const session = await requireSession();
  const store = await loadReportStore();

  return store.items
    .filter((item) => item.reporterId === session.user.id)
    .sort(sortReportsDesc)
    .map(cloneReport);
}

export async function getMyReportByDate(reportDate: string): Promise<ServiceReportItem | null> {
  const session = await requireSession();
  const store = await loadReportStore();

  const found = store.items.find((item) => item.reporterId === session.user.id && item.reportDate === reportDate);
  return found ? cloneReport(found) : null;
}

export async function getAllReports(): Promise<ServiceReportItem[]> {
  return withAdminAction(async () => {
    const store = await loadReportStore();
    return store.items.slice().sort(sortReportsDesc).map(cloneReport);
  });
}

export async function upsertMyReport(dto: UpsertReportDto): Promise<ServiceReportItem> {
  const session = await requireSession();
  const parsed = upsertReportSchema.safeParse(dto);
  if (!parsed.success) {
    throw new AppError('E007', '입력값을 확인해주세요.', 422);
  }

  const store = await loadReportStore();
  const now = new Date().toISOString();
  const status = parsed.data.status ?? 'SUBMITTED';

  const existing = store.items.find((item) => item.reporterId === session.user.id && item.reportDate === parsed.data.reportDate);

  if (existing) {
    existing.status = status;
    existing.ministryType = parsed.data.ministryType;
    existing.revisitCount = parsed.data.revisitCount;
    existing.contactExchangeCount = parsed.data.contactExchangeCount;
    existing.visitRequestCount = parsed.data.visitRequestCount;
    existing.bibleStudyProposalCount = parsed.data.bibleStudyProposalCount;
    existing.bibleStudyStartCount = parsed.data.bibleStudyStartCount;
    existing.subwayShift = parsed.data.subwayShift;
    existing.subwayLocation = parsed.data.subwayLocation.trim();
    existing.magazineCount = parsed.data.magazineCount;
    existing.brochureCount = parsed.data.brochureCount;
    existing.subwayVisitRequestCount = parsed.data.subwayVisitRequestCount;
    existing.notes = parsed.data.notes.trim();
    existing.experienceServiceType = parsed.data.experienceServiceType.trim();
    existing.experienceType = parsed.data.experienceType.trim();
    existing.experienceContent = parsed.data.experienceContent.trim();
    existing.updatedAt = now;

    await saveReportStore(store);
    revalidatePath('/report');
    revalidatePath('/mypage');
    return cloneReport(existing);
  }

  const created: ServiceReportItem = {
    id: store.nextId,
    reporterId: session.user.id,
    reporterName: session.user.username,
    reportDate: parsed.data.reportDate,
    status,
    ministryType: parsed.data.ministryType,
    revisitCount: parsed.data.revisitCount,
    contactExchangeCount: parsed.data.contactExchangeCount,
    visitRequestCount: parsed.data.visitRequestCount,
    bibleStudyProposalCount: parsed.data.bibleStudyProposalCount,
    bibleStudyStartCount: parsed.data.bibleStudyStartCount,
    subwayShift: parsed.data.subwayShift,
    subwayLocation: parsed.data.subwayLocation.trim(),
    magazineCount: parsed.data.magazineCount,
    brochureCount: parsed.data.brochureCount,
    subwayVisitRequestCount: parsed.data.subwayVisitRequestCount,
    notes: parsed.data.notes.trim(),
    experienceServiceType: parsed.data.experienceServiceType.trim(),
    experienceType: parsed.data.experienceType.trim(),
    experienceContent: parsed.data.experienceContent.trim(),
    createdAt: now,
    updatedAt: now,
  };

  store.items.unshift(created);
  store.nextId += 1;

  await saveReportStore(store);
  revalidatePath('/report');
  revalidatePath('/mypage');
  return cloneReport(created);
}

export async function upsertMyReportAction(formData: FormData) {
  return upsertMyReport({
    status: parseStatus(formData.get('status')),
    reportDate: String(formData.get('reportDate') || ''),
    ministryType: String(formData.get('ministryType') || '') as 'CIRCUIT' | 'SUBWAY',
    revisitCount: Number(formData.get('revisitCount') ?? 0),
    contactExchangeCount: Number(formData.get('contactExchangeCount') ?? 0),
    visitRequestCount: Number(formData.get('visitRequestCount') ?? 0),
    bibleStudyProposalCount: Number(formData.get('bibleStudyProposalCount') ?? 0),
    bibleStudyStartCount: Number(formData.get('bibleStudyStartCount') ?? 0),
    subwayShift: String(formData.get('subwayShift') ?? '') as 'AM' | 'PM' | '',
    subwayLocation: String(formData.get('subwayLocation') ?? ''),
    magazineCount: Number(formData.get('magazineCount') ?? 0),
    brochureCount: Number(formData.get('brochureCount') ?? 0),
    subwayVisitRequestCount: Number(formData.get('subwayVisitRequestCount') ?? 0),
    notes: String(formData.get('notes') ?? ''),
    experienceServiceType: String(formData.get('experienceServiceType') ?? ''),
    experienceType: String(formData.get('experienceType') ?? ''),
    experienceContent: String(formData.get('experienceContent') ?? ''),
  });
}

export async function cancelMySubmittedReport(reportDate: string): Promise<ServiceReportItem> {
  const session = await requireSession();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
    throw new AppError('E007', '입력값을 확인해주세요.', 422);
  }

  const store = await loadReportStore();
  const target = store.items.find((item) => item.reporterId === session.user.id && item.reportDate === reportDate);
  if (!target) {
    throw new AppError('E004', '대상 보고를 찾을 수 없습니다.', 404);
  }

  target.status = 'DRAFT';
  target.updatedAt = new Date().toISOString();

  await saveReportStore(store);
  revalidatePath('/report');
  revalidatePath('/mypage');
  return cloneReport(target);
}
