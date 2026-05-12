'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { AppError } from '@/lib/errors';
import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { withAdminAction } from '@/lib/with-admin';
import rawUsers from '@/data/users-cleaned.json';

const FIXED_PASSWORD = '191435';

export type AdminManagedUser = {
  id: string;
  username: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
};

function normalizeUsername(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeRole(value: unknown): 'USER' | 'ADMIN' {
  return value === 'ADMIN' ? 'ADMIN' : 'USER';
}

function revalidateUserPaths() {
  revalidatePath('/mypage');
  revalidatePath('/schedule');
}

export async function getUsersForAdmin(): Promise<AdminManagedUser[]> {
  return withAdminAction(async () => {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('User')
        .select('id,username,role,createdAt')
        .order('username', { ascending: true });

      if (error) {
        throw new AppError('E009', `유저 목록 조회에 실패했습니다. ${error.message}`, 500);
      }

      return (data ?? []).map((row) => ({
        id: String(row.id),
        username: String(row.username),
        role: normalizeRole(row.role),
        createdAt: String(row.createdAt ?? new Date().toISOString()),
      }));
    }

    if (isDatabaseConfigured) {
      const users = await prisma.user.findMany({
        select: { id: true, username: true, role: true, createdAt: true },
        orderBy: { username: 'asc' },
      });

      return users.map((user) => ({
        id: String(user.id),
        username: user.username,
        role: normalizeRole(user.role),
        createdAt: user.createdAt.toISOString(),
      }));
    }

    return rawUsers.map((user, index) => ({
      id: `mock-${index + 1}`,
      username: user.username,
      role: 'USER',
      createdAt: new Date().toISOString(),
    }));
  });
}

export async function createUserByAdmin(usernameInput: string): Promise<AdminManagedUser> {
  return withAdminAction(async () => {
    const username = normalizeUsername(usernameInput);
    if (!username) {
      throw new AppError('E007', '이름을 입력해주세요.', 422);
    }

    const passwordHash = await bcrypt.hash(FIXED_PASSWORD, 12);
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('User')
        .insert({
          username,
          password: passwordHash,
          role: 'USER',
          createdAt: now,
          updatedAt: now,
        })
        .select('id,username,role,createdAt')
        .single();

      if (error) {
        if (String(error.code) === '23505') {
          throw new AppError('E010', '이미 등록된 사용자입니다.', 409);
        }
        throw new AppError('E009', `사용자 추가에 실패했습니다. ${error.message}`, 500);
      }

      revalidateUserPaths();
      return {
        id: String(data.id),
        username: String(data.username),
        role: normalizeRole(data.role),
        createdAt: String(data.createdAt ?? now),
      };
    }

    if (isDatabaseConfigured) {
      try {
        const created = await prisma.user.create({
          data: {
            username,
            password: passwordHash,
            role: 'USER',
          },
          select: {
            id: true,
            username: true,
            role: true,
            createdAt: true,
          },
        });

        revalidateUserPaths();
        return {
          id: String(created.id),
          username: created.username,
          role: normalizeRole(created.role),
          createdAt: created.createdAt.toISOString(),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('Unique constraint')) {
          throw new AppError('E010', '이미 등록된 사용자입니다.', 409);
        }
        throw new AppError('E009', `사용자 추가에 실패했습니다. ${message}`, 500);
      }
    }

    throw new AppError('E009', '실제 DB 연결이 없어 사용자 추가가 불가능합니다.', 503);
  });
}

export async function deleteUserByAdmin(userIdInput: string): Promise<void> {
  await withAdminAction(async (session) => {
    const userId = String(userIdInput || '').trim();
    if (!userId) {
      throw new AppError('E007', '삭제할 사용자 정보가 올바르지 않습니다.', 422);
    }

    const sessionBaseUsername = normalizeUsername(String(session.user.username || '').replace(/관리자$/, ''));

    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from('User')
        .select('id,username')
        .eq('id', userId)
        .maybeSingle();

      if (existingError) {
        throw new AppError('E009', `사용자 조회에 실패했습니다. ${existingError.message}`, 500);
      }
      if (!existing) {
        throw new AppError('E004', '사용자를 찾을 수 없습니다.', 404);
      }

      if (normalizeUsername(existing.username) === sessionBaseUsername) {
        throw new AppError('E010', '현재 로그인한 관리자 계정은 삭제할 수 없습니다.', 409);
      }

      const { error } = await supabaseAdmin.from('User').delete().eq('id', userId);
      if (error) {
        throw new AppError('E009', `사용자 삭제에 실패했습니다. ${error.message}`, 500);
      }
      revalidateUserPaths();
      return;
    }

    if (isDatabaseConfigured) {
      const targetId = Number(userId);
      if (!Number.isFinite(targetId)) {
        throw new AppError('E007', '삭제할 사용자 정보가 올바르지 않습니다.', 422);
      }

      const target = await prisma.user.findUnique({
        where: { id: targetId },
        select: { username: true },
      });
      if (!target) {
        throw new AppError('E004', '사용자를 찾을 수 없습니다.', 404);
      }
      if (normalizeUsername(target.username) === sessionBaseUsername) {
        throw new AppError('E010', '현재 로그인한 관리자 계정은 삭제할 수 없습니다.', 409);
      }

      await prisma.user.delete({ where: { id: targetId } });
      revalidateUserPaths();
      return;
    }

    throw new AppError('E009', '실제 DB 연결이 없어 사용자 삭제가 불가능합니다.', 503);
  });
}

export async function createUserByAdminAction(formData: FormData) {
  await createUserByAdmin(String(formData.get('username') || ''));
}

export async function deleteUserByAdminAction(formData: FormData) {
  await deleteUserByAdmin(String(formData.get('id') || ''));
}
