import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';

const SYSTEM_PREFIX = '__SYSTEM__';

type SystemStateRecord = {
  id: number;
  content: string;
};

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function readFromSupabase(title: string): Promise<SystemStateRecord | null> {
  if (!isSupabaseConfigured || !supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from('Notice')
    .select('id,content')
    .eq('title', title)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase 조회 실패: ${error.message}`);
  }
  if (!data) return null;

  return {
    id: data.id as number,
    content: data.content as string,
  };
}

async function writeToSupabase(title: string, content: string) {
  if (!isSupabaseConfigured || !supabaseAdmin) return false;
  const now = new Date().toISOString();

  const existing = await readFromSupabase(title);
  if (existing) {
    const { error } = await supabaseAdmin.from('Notice').update({ content, updatedAt: now }).eq('id', existing.id);
    if (error) {
      throw new Error(`Supabase 저장 실패: ${error.message}`);
    }
    return true;
  }

  const { error } = await supabaseAdmin.from('Notice').insert({
    title,
    content,
    isPinned: false,
    createdAt: now,
    updatedAt: now,
  });
  if (error) {
    throw new Error(`Supabase 저장 실패: ${error.message}`);
  }
  return true;
}

async function readFromPrisma(title: string): Promise<SystemStateRecord | null> {
  if (!isDatabaseConfigured) return null;

  const row = await prisma.notice.findFirst({
    where: { title },
    orderBy: { id: 'desc' },
    select: { id: true, content: true },
  });
  if (!row) return null;
  return { id: row.id, content: row.content };
}

async function writeToPrisma(title: string, content: string) {
  if (!isDatabaseConfigured) return false;

  const existing = await readFromPrisma(title);
  if (existing) {
    await prisma.notice.update({
      where: { id: existing.id },
      data: { content },
    });
    return true;
  }

  await prisma.notice.create({
    data: {
      title,
      content,
      isPinned: false,
    },
  });
  return true;
}

export function isSystemStateTitle(title: string) {
  return title.startsWith(SYSTEM_PREFIX);
}

export async function loadSystemStateJson<T>(title: string, createDefault: () => T): Promise<T> {
  const canUseSupabase = isSupabaseConfigured && Boolean(supabaseAdmin);

  try {
    if (canUseSupabase) {
      const row = await readFromSupabase(title);
      if (row) {
        const parsed = safeJsonParse<T>(row.content);
        if (parsed !== null) {
          return parsed;
        }
      }

      const initialValue = createDefault();
      await saveSystemStateJson(title, initialValue);
      return initialValue;
    }
  } catch (error) {
    console.warn(`[system-state] Supabase read failed for ${title}:`, error);
  }

  try {
    const row = await readFromPrisma(title);
    if (row) {
      const parsed = safeJsonParse<T>(row.content);
      if (parsed !== null) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn(`[system-state] Prisma read failed for ${title}:`, error);
  }

  try {
    const initialValue = createDefault();
    await saveSystemStateJson(title, initialValue);
    return initialValue;
  } catch (error) {
    throw new Error(`시스템 상태 초기화에 실패했습니다. (${title}) ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function saveSystemStateJson<T>(title: string, value: T): Promise<void> {
  const payload = JSON.stringify(value);

  try {
    const saved = await writeToSupabase(title, payload);
    if (saved) return;
  } catch (error) {
    console.warn(`[system-state] Supabase write failed for ${title}:`, error);
  }

  const saved = await writeToPrisma(title, payload);
  if (saved) return;

  throw new Error(`시스템 상태를 저장할 DB 연결이 없습니다. (${title})`);
}
