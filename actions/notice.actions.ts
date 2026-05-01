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

function mapToClient(record: {
  id: number;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: Date | string;
}): NoticeItem {
  return {
    id: record.id,
    title: record.title,
    content: record.content,
    isPinned: record.isPinned,
    createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
  };
}

export async function getNotices(): Promise<NoticeItem[]> {
  if (isDatabaseConfigured) {
    try {
      const notices = await prisma.notice.findMany({
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      });
      return notices.map(mapToClient);
    } catch {
      // fallback below
    }
  }

  const state = getMockState();
  return state.notices
    .slice()
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .map((item) => ({ ...item }));
}

export async function createNotice(dto: CreateNoticeDto): Promise<NoticeItem> {
  return withAdminAction(async (session) => {
    const parsed = createNoticeSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    if (isDatabaseConfigured) {
      try {
        const created = await prisma.notice.create({
          data: {
            title: parsed.data.title,
            content: parsed.data.content,
            isPinned: parsed.data.isPinned ?? false,
            createdBy: Number.isFinite(Number(session.user.id)) ? Number(session.user.id) : undefined,
          },
        });
        return mapToClient(created);
      } catch {
        // fallback below
      }
    }

    const state = getMockState();
    const created: NoticeItem = {
      id: state.nextNoticeId++,
      title: parsed.data.title,
      content: parsed.data.content,
      isPinned: parsed.data.isPinned ?? false,
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

    if (isDatabaseConfigured) {
      try {
        const updated = await prisma.notice.update({
          where: { id },
          data: {
            title: parsed.data.title,
            content: parsed.data.content,
            isPinned: parsed.data.isPinned ?? false,
          },
        });
        return mapToClient(updated);
      } catch {
        // fallback below
      }
    }

    const state = getMockState();
    const target = state.notices.find((item) => item.id === id);
    if (!target) {
      throw new AppError('E004', '공지사항을 찾을 수 없습니다.', 404);
    }

    target.title = parsed.data.title;
    target.content = parsed.data.content;
    target.isPinned = parsed.data.isPinned ?? false;
    return { ...target };
  });
}

export async function deleteNotice(id: number): Promise<void> {
  await withAdminAction(async () => {
    if (isDatabaseConfigured) {
      try {
        await prisma.notice.delete({ where: { id } });
        return;
      } catch {
        // fallback below
      }
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
  });

  revalidatePath('/notice');
  revalidatePath('/dashboard');
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
  });

  revalidatePath('/notice');
  revalidatePath('/dashboard');
}

export async function deleteNoticeAction(formData: FormData) {
  const id = Number(formData.get('id'));
  if (!Number.isFinite(id)) {
    throw new AppError('E007', '입력값을 확인해주세요.', 422);
  }

  await deleteNotice(id);
  revalidatePath('/notice');
  revalidatePath('/dashboard');
}
