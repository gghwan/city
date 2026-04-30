import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { DEMO_USERS } from '@/lib/constants';
import { loginRateLimiter } from '@/lib/rate-limiter';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const demoHash = bcrypt.hashSync('191435', 12);

async function findUser(username: string) {
  if (isDatabaseConfigured) {
    try {
      const dbUser = await prisma.user.findUnique({ where: { username } });
      if (dbUser) {
        return {
          id: dbUser.id.toString(),
          username: dbUser.username,
          role: dbUser.role as 'USER' | 'ADMIN',
          password: dbUser.password,
          isHashed: true,
        };
      }
    } catch {
      // fallback below
    }
  }

  const demoUser = DEMO_USERS.find((user) => user.username === username);
  if (!demoUser) return null;

  return {
    id: demoUser.username,
    username: demoUser.username,
    role: demoUser.role,
    password: demoHash,
    isHashed: true,
  };
}

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

        const ipHeader = req?.headers?.['x-forwarded-for'];
        const ip = Array.isArray(ipHeader) ? ipHeader[0] : ipHeader || 'unknown';
        const rate = await loginRateLimiter.limit(ip);
        if (!rate.success) return null;

        const found = await findUser(parsed.data.username);
        if (!found) return null;

        const valid = await bcrypt.compare(parsed.data.password, found.password);
        if (!valid) return null;

        return {
          id: found.id,
          username: found.username,
          role: found.role,
          name: found.username,
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
