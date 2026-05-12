'use server';

import { LinkType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { withAdminAction } from '@/lib/with-admin';
import { AppError } from '@/lib/errors';
import { updateLinkSchema } from '@/lib/validations/link.schema';
import { getMockState } from '@/lib/mock-db';
import { DEFAULT_LINKS } from '@/lib/constants';
import type { LinkSet } from '@/types';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

const useMockDb = process.env.USE_MOCK_DB === 'true';

type SupabaseLinkRow = {
  type: LinkType;
  url: string;
  updatedAt: string;
};

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

export async function getLinks(): Promise<LinkSet> {
  let supabaseReadError: string | null = null;

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.from('Link').select('type,url,updatedAt');
      if (error) {
        supabaseReadError = toReadableSupabaseError(error);
      } else {
        const links = (data ?? []) as SupabaseLinkRow[];
        const mapLink = links.find((link) => link.type === LinkType.MAP);
        const cardLink = links.find((link) => link.type === LinkType.CARD);
        const talkLink = links.find((link) => link.type === LinkType.TALK);
        return {
          map: {
            url: mapLink?.url ?? DEFAULT_LINKS.map,
            updatedAt: mapLink?.updatedAt ?? null,
          },
          card: {
            url: cardLink?.url ?? DEFAULT_LINKS.card,
            updatedAt: cardLink?.updatedAt ?? null,
          },
          talk: {
            url: talkLink?.url ?? DEFAULT_LINKS.talk,
            updatedAt: talkLink?.updatedAt ?? null,
          },
        };
      }
    } catch (error) {
      supabaseReadError = toReadableUnknownError(error);
    }
  }

  if (isDatabaseConfigured) {
    try {
      const links = await prisma.link.findMany();
      const mapLink = links.find((link) => link.type === LinkType.MAP);
      const cardLink = links.find((link) => link.type === LinkType.CARD);
      const talkLink = links.find((link) => link.type === LinkType.TALK);
      return {
        map: {
          url: mapLink?.url ?? DEFAULT_LINKS.map,
          updatedAt: mapLink?.updatedAt.toISOString() ?? null,
        },
        card: {
          url: cardLink?.url ?? DEFAULT_LINKS.card,
          updatedAt: cardLink?.updatedAt.toISOString() ?? null,
        },
        talk: {
          url: talkLink?.url ?? DEFAULT_LINKS.talk,
          updatedAt: talkLink?.updatedAt.toISOString() ?? null,
        },
      };
    } catch {
      // fallback below
    }
  }

  if (!useMockDb) {
    const detail = supabaseReadError ? ` Supabase 오류: ${supabaseReadError}` : '';
    throw new AppError('E009', `실제 DB 연결 정보가 없어 링크를 읽을 수 없습니다.${detail}`, 503);
  }

  if (supabaseReadError) {
    console.warn(`[getLinks] Supabase 조회 실패, mock으로 폴백합니다: ${supabaseReadError}`);
  }

  const state = getMockState();
  return { ...state.links };
}

export async function updateLink(type: 'map' | 'card' | 'talk', url: string): Promise<void> {
  await withAdminAction(async (session) => {
    const parsed = updateLinkSchema.safeParse({ type, url });
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    const prismaType =
      type === 'map' ? LinkType.MAP : type === 'card' ? LinkType.CARD : LinkType.TALK;

    if (isSupabaseConfigured && supabaseAdmin) {
      const now = new Date().toISOString();
      const { error } = await supabaseAdmin
        .from('Link')
        .upsert(
          {
            type: prismaType,
            url,
            updatedBy: Number.isFinite(Number(session.user.id)) ? Number(session.user.id) : null,
            updatedAt: now,
          },
          { onConflict: 'type' },
        );
      if (error) {
        throw new AppError('E009', `링크 저장에 실패했습니다. ${toReadableSupabaseError(error)}`, 500);
      }
      return;
    }

    if (isDatabaseConfigured) {
      try {
        await prisma.link.upsert({
          where: { type: prismaType },
          update: {
            url,
            updatedBy: Number.isFinite(Number(session.user.id)) ? Number(session.user.id) : undefined,
          },
          create: {
            type: prismaType,
            url,
            updatedBy: Number.isFinite(Number(session.user.id)) ? Number(session.user.id) : undefined,
          },
        });
        return;
      } catch {
        // fallback below
      }
    }

    if (!useMockDb) {
      throw new AppError('E009', '실제 DB 연결 정보가 없어 링크를 저장할 수 없습니다.', 503);
    }

    const state = getMockState();
    state.links[type] = {
      url,
      updatedAt: new Date().toISOString(),
    };
  });
}

export async function updateLinkAction(formData: FormData) {
  const type = formData.get('type');
  const url = formData.get('url');

  if ((type !== 'map' && type !== 'card' && type !== 'talk') || typeof url !== 'string') {
    throw new AppError('E007', '입력값을 확인해주세요.', 422);
  }

  await updateLink(type, url);
  revalidatePath('/map');
  revalidatePath('/card');
  revalidatePath('/talk');
}
