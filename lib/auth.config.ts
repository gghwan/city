import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { z } from 'zod';
import { loginRateLimiter } from '@/lib/rate-limiter';
import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const FIXED_PASSWORD = '191435';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24,
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: '아이디', type: 'text' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const username = parsed.data.username.trim();
        if (!username) return null;

        const ipHeader = req?.headers?.['x-forwarded-for'];
        const ip = Array.isArray(ipHeader) ? ipHeader[0] : ipHeader || 'unknown';
        const rate = await loginRateLimiter.limit(ip);
        if (!rate.success) return null;

        if (parsed.data.password !== FIXED_PASSWORD) return null;
        const isAdminLogin = username.endsWith('관리자');
        const baseUsername = isAdminLogin ? username.slice(0, -3).trim() : username;
        if (!baseUsername) return null;

        let userId = baseUsername;
        let storedUsername = baseUsername;
        let hasValidatedUser = false;

        if (isSupabaseConfigured && supabaseAdmin) {
          try {
            const { data, error } = await supabaseAdmin
              .from('User')
              .select('id,username')
              .eq('username', baseUsername)
              .maybeSingle();

            if (error) {
              console.warn('[auth] Supabase 사용자 조회 실패:', error.message);
            } else if (data) {
              userId = String(data.id);
              storedUsername = data.username;
              hasValidatedUser = true;
            } else {
              return null;
            }
          } catch (error) {
            console.warn('[auth] Supabase 사용자 조회 예외:', error);
          }
        }

        if (!hasValidatedUser && isDatabaseConfigured) {
          try {
            const user = await prisma.user.findUnique({
              where: { username: baseUsername },
              select: { id: true, username: true },
            });
            if (!user) return null;
            userId = String(user.id);
            storedUsername = user.username;
            hasValidatedUser = true;
          } catch (error) {
            console.warn('[auth] DB 사용자 조회 실패, 이름 기반 임시 폴백 사용:', error);
          }
        }

        if (!hasValidatedUser && (isSupabaseConfigured || isDatabaseConfigured)) {
          return null;
        }

        const role = isAdminLogin ? 'ADMIN' : 'USER';
        const sessionUsername = isAdminLogin ? `${storedUsername}관리자` : storedUsername;

        return {
          id: userId,
          username: sessionUsername,
          role,
          name: sessionUsername,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as 'USER' | 'ADMIN';
        session.user.name = token.username as string;
      }
      return session;
    },
  },
};
