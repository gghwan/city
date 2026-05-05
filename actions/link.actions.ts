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

export async function getLinks(): Promise<LinkSet> {
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
