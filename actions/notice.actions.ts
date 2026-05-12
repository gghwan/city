'use server';

import { revalidatePath } from 'next/cache';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { withAdminAction } from '@/lib/with-admin';
import { AppError } from '@/lib/errors';
import { getMockState } from '@/lib/mock-db';
import {
  createNoticeSchema,
  updateNoticeSchema,
  type CreateNoticeDto,
  type UpdateNoticeDto,
} from '@/lib/validations/notice.schema';
import type { NoticeItem } from '@/types';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';
import { isSystemStateTitle } from '@/lib/system-state';
import { decodeNoticeTitle, encodeNoticeTitle, normalizeNoticeType } from '@/lib/notice-meta';

const useMockDb = process.env.USE_MOCK_DB === 'true';

function mapToClient(record: {
  id: number;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: Date | string;
}): NoticeItem {
  const decoded = decodeNoticeTitle(record.title);
  return {
    id: record.id,
    title: decoded.title,
    content: record.content,
    isPinned: record.isPinned,
    noticeType: decoded.noticeType,
    createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
  };
}

type SupabaseNoticeRow = {
  id: number;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
};

function mapSupabaseToClient(record: SupabaseNoticeRow): NoticeItem {
  const decoded = decodeNoticeTitle(record.title);
  return {
    id: record.id,
    title: decoded.title,
    content: record.content,
    isPinned: record.isPinned,
    noticeType: decoded.noticeType,
    createdAt: record.createdAt,
  };
}

function toReadableSupabaseError(error: PostgrestError | null) {
  if (!error) return '알 수 없는 Supabase 오류';
  const code = error.code ? `[${error.code}] ` : '';
  return `${code}${error.message}`;
}

function toReadableUnknownError(error: unknown) {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

export async function getNotices(): Promise<NoticeItem[]> {
  let supabaseReadError: string | null = null;

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('Notice')
        .select('id,title,content,isPinned,createdAt')
        .not('title', 'like', '__SYSTEM__%')
        .order('isPinned', { ascending: false })
        .order('createdAt', { ascending: false });

      if (error) {
        supabaseReadError = toReadableSupabaseError(error);
      } else {
        return (data as SupabaseNoticeRow[]).map(mapSupabaseToClient);
      }
    } catch (error) {
      supabaseReadError = toReadableUnknownError(error);
    }
  }

  if (isDatabaseConfigured) {
    try {
      const notices = await prisma.notice.findMany({
        where: {
          title: {
            not: {
              startsWith: '__SYSTEM__',
            },
          },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      });
      return notices.map(mapToClient);
    } catch {
      // fallback below
    }
  }

  if (!useMockDb) {
    const detail = supabaseReadError ? ` Supabase 오류: ${supabaseReadError}` : '';
    throw new AppError('E009', `실제 DB 연결 정보가 없어 공지를 읽을 수 없습니다.${detail}`, 503);
  }

  if (supabaseReadError) {
    console.warn(`[getNotices] Supabase 조회 실패, mock으로 폴백합니다: ${supabaseReadError}`);
  }

  const state = getMockState();
  return state.notices
    .filter((item) => !isSystemStateTitle(item.title))
    .slice()
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .map((item) => {
      const decoded = decodeNoticeTitle(item.title);
      return {
        ...item,
        title: decoded.title,
        noticeType: normalizeNoticeType(item.noticeType ?? decoded.noticeType),
      };
    });
}

export async function createNotice(dto: CreateNoticeDto): Promise<NoticeItem> {
  return withAdminAction(async (session) => {
    const parsed = createNoticeSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    const noticeType = normalizeNoticeType(parsed.data.noticeType);
    const pinRequested = parsed.data.isPinned ?? false;

    if (isSupabaseConfigured && supabaseAdmin) {
      const now = new Date().toISOString();
      if (pinRequested) {
        const { error: clearError } = await supabaseAdmin
          .from('Notice')
          .update({ isPinned: false, updatedAt: now })
          .eq('isPinned', true)
          .not('title', 'like', '__SYSTEM__%');

        if (clearError) {
          throw new AppError('E009', `기존 고정 공지 해제에 실패했습니다. ${toReadableSupabaseError(clearError)}`, 500);
        }
      }

      const { data, error } = await supabaseAdmin
        .from('Notice')
        .insert({
          title: encodeNoticeTitle(parsed.data.title, noticeType),
          content: parsed.data.content,
          isPinned: pinRequested,
          createdBy: Number.isFinite(Number(session.user.id)) ? Number(session.user.id) : null,
          createdAt: now,
          updatedAt: now,
        })
        .select('id,title,content,isPinned,createdAt')
        .single();
      if (error || !data) {
        throw new AppError('E009', `공지 등록에 실패했습니다. ${toReadableSupabaseError(error)}`, 500);
      }
      return mapSupabaseToClient(data as SupabaseNoticeRow);
    }

    if (isDatabaseConfigured) {
      try {
        if (pinRequested) {
          await prisma.notice.updateMany({
            where: {
              isPinned: true,
              NOT: {
                title: {
                  startsWith: '__SYSTEM__',
                },
              },
            },
            data: {
              isPinned: false,
            },
          });
        }

        const created = await prisma.notice.create({
          data: {
            title: encodeNoticeTitle(parsed.data.title, noticeType),
            content: parsed.data.content,
            isPinned: pinRequested,
            createdBy: Number.isFinite(Number(session.user.id)) ? Number(session.user.id) : undefined,
          },
        });
        return mapToClient(created);
      } catch {
        // fallback below
      }
    }

    if (!useMockDb) {
      throw new AppError('E009', '실제 DB 연결 정보가 없어 공지를 저장할 수 없습니다.', 503);
    }

    const state = getMockState();
    if (pinRequested) {
      state.notices = state.notices.map((item) => (isSystemStateTitle(item.title) ? item : { ...item, isPinned: false }));
    }
    const created: NoticeItem = {
      id: state.nextNoticeId++,
      title: parsed.data.title,
      content: parsed.data.content,
      isPinned: pinRequested,
      noticeType,
      createdAt: new Date().toISOString(),
    };
    state.notices.unshift(created);
    return created;
  });
}

export async function updateNotice(id: number, dto: UpdateNoticeDto): Promise<NoticeItem> {
  return withAdminAction(async () => {
    const parsed = updateNoticeSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    const noticeType = normalizeNoticeType(parsed.data.noticeType);
    const pinRequested = parsed.data.isPinned ?? false;

    if (isSupabaseConfigured && supabaseAdmin) {
      const now = new Date().toISOString();
      if (pinRequested) {
        const { error: clearError } = await supabaseAdmin
          .from('Notice')
          .update({ isPinned: false, updatedAt: now })
          .eq('isPinned', true)
          .neq('id', id)
          .not('title', 'like', '__SYSTEM__%');

        if (clearError) {
          throw new AppError('E009', `기존 고정 공지 해제에 실패했습니다. ${toReadableSupabaseError(clearError)}`, 500);
        }
      }

      const { data, error } = await supabaseAdmin
        .from('Notice')
        .update({
          title: encodeNoticeTitle(parsed.data.title, noticeType),
          content: parsed.data.content,
          isPinned: pinRequested,
          updatedAt: now,
        })
        .eq('id', id)
        .select('id,title,content,isPinned,createdAt')
        .single();
      if (error || !data) {
        throw new AppError('E009', `공지 수정에 실패했습니다. ${toReadableSupabaseError(error)}`, 500);
      }
      return mapSupabaseToClient(data as SupabaseNoticeRow);
    }

    if (isDatabaseConfigured) {
      try {
        if (pinRequested) {
          await prisma.notice.updateMany({
            where: {
              isPinned: true,
              id: {
                not: id,
              },
              NOT: {
                title: {
                  startsWith: '__SYSTEM__',
                },
              },
            },
            data: {
              isPinned: false,
            },
          });
        }

        const updated = await prisma.notice.update({
          where: { id },
          data: {
            title: encodeNoticeTitle(parsed.data.title, noticeType),
            content: parsed.data.content,
            isPinned: pinRequested,
          },
        });
        return mapToClient(updated);
      } catch {
        // fallback below
      }
    }

    if (!useMockDb) {
      throw new AppError('E009', '실제 DB 연결 정보가 없어 공지를 수정할 수 없습니다.', 503);
    }

    const state = getMockState();
    const target = state.notices.find((item) => item.id === id);
    if (!target) {
      throw new AppError('E004', '공지사항을 찾을 수 없습니다.', 404);
    }

    if (pinRequested) {
      state.notices = state.notices.map((item) =>
        item.id !== id && !isSystemStateTitle(item.title) ? { ...item, isPinned: false } : item
      );
    }

    target.title = parsed.data.title;
    target.content = parsed.data.content;
    target.isPinned = pinRequested;
    target.noticeType = noticeType;
    return { ...target };
  });
}

export async function deleteNotice(id: number): Promise<void> {
  await withAdminAction(async () => {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { error } = await supabaseAdmin.from('Notice').delete().eq('id', id);
      if (error) {
        throw new AppError('E009', `공지 삭제에 실패했습니다. ${toReadableSupabaseError(error)}`, 500);
      }
      return;
    }

    if (isDatabaseConfigured) {
      try {
        await prisma.notice.delete({ where: { id } });
        return;
      } catch {
        // fallback below
      }
    }

    if (!useMockDb) {
      throw new AppError('E009', '실제 DB 연결 정보가 없어 공지를 삭제할 수 없습니다.', 503);
    }

    const state = getMockState();
    state.notices = state.notices.filter((item) => item.id !== id);
  });
}

function toBoolean(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return false;
  return value === 'on' || value === 'true' || value === '1';
}

export async function createNoticeAction(formData: FormData) {
  await createNotice({
    title: String(formData.get('title') || ''),
    content: String(formData.get('content') || ''),
    isPinned: toBoolean(formData.get('isPinned')),
    noticeType: normalizeNoticeType(formData.get('noticeType')),
  });

  revalidatePath('/notice');
  revalidatePath('/dashboard');
  revalidatePath('/', 'layout');
}

export async function updateNoticeAction(formData: FormData) {
  const id = Number(formData.get('id'));
  if (!Number.isFinite(id)) {
    throw new AppError('E007', '입력값을 확인해주세요.', 422);
  }

  await updateNotice(id, {
    title: String(formData.get('title') || ''),
    content: String(formData.get('content') || ''),
    isPinned: toBoolean(formData.get('isPinned')),
    noticeType: normalizeNoticeType(formData.get('noticeType')),
  });

  revalidatePath('/notice');
  revalidatePath('/dashboard');
  revalidatePath('/', 'layout');
}

export async function deleteNoticeAction(formData: FormData) {
  const id = Number(formData.get('id'));
  if (!Number.isFinite(id)) {
    throw new AppError('E007', '입력값을 확인해주세요.', 422);
  }

  await deleteNotice(id);
  revalidatePath('/notice');
  revalidatePath('/dashboard');
  revalidatePath('/', 'layout');
}
