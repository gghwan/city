import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { z } from 'zod';
import { loginRateLimiter } from '@/lib/rate-limiter';

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
        const role = username.endsWith('관리자') ? 'ADMIN' : 'USER';

        return {
          id: username,
          username,
          role,
          name: username,
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
