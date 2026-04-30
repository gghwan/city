'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, User } from 'lucide-react';
import { loginFormSchema, type LoginFormSchema } from '@/lib/validations/auth.schema';

export function LoginForm() {
  const [error, setError] = useState('');
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormSchema>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (values: LoginFormSchema) => {
    setError('');
    const result = await signIn('credentials', {
      username: values.username,
      password: values.password,
      redirect: false,
    });

    if (!result || result.error) {
      setError('아이디 또는 비밀번호가 틀렸습니다');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-3xl border border-borderColor bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-center text-xl font-black text-textBase">캠페인 로그인</h1>
        <p className="mb-6 text-center text-xs text-textMuted">서울풍납 회중 2026 대도시 캠페인</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-textMuted">아이디</label>
            <div className="flex items-center rounded-xl border border-borderColor bg-surface px-3">
              <User className="h-4 w-4 text-textMuted" />
              <input
                {...register('username')}
                className="w-full bg-transparent px-2 py-3 text-sm outline-none"
                placeholder="김주형 또는 김주형관리자"
              />
            </div>
            {errors.username && <p className="mt-1 text-xs text-error">{errors.username.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-textMuted">비밀번호</label>
            <div className="flex items-center rounded-xl border border-borderColor bg-surface px-3">
              <Lock className="h-4 w-4 text-textMuted" />
              <input
                {...register('password')}
                type="password"
                className="w-full bg-transparent px-2 py-3 text-sm outline-none"
                placeholder="191435"
              />
            </div>
            {errors.password && <p className="mt-1 text-xs text-error">{errors.password.message}</p>}
          </div>

          {error && <p className="rounded-xl bg-error/10 px-3 py-2 text-xs font-semibold text-error">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primaryHover disabled:opacity-60"
          >
            {isSubmitting ? '로그인 중...' : '입장하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
