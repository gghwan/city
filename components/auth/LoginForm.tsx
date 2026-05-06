'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, MapPin, ShieldCheck, User } from 'lucide-react';
import { loginFormSchema, type LoginFormSchema } from '@/lib/validations/auth.schema';
import { useNavigationStore } from '@/stores/navigation.store';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export function LoginForm() {
  const [error, setError] = useState('');
  const router = useRouter();
  const startRouteLoading = useNavigationStore((state) => state.startRouteLoading);
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

    startRouteLoading();
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#f6f5f0] text-[#2d2a23]">
      <aside className="relative hidden w-[56%] xl:block">
        <div className="absolute inset-0 bg-[#066b6c]">
          <img
            src="https://images.unsplash.com/photo-1616059160527-7729f2da5b1c?auto=format&fit=crop&q=80&w=1920"
            alt="서울 캠페인 배경"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#023132]/90 via-[#066b6c]/40 to-transparent" />
        </div>
        <div className="relative z-10 flex h-full flex-col justify-between p-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div className="max-w-xl">
            <p className="mb-5 inline-flex rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-xs font-bold tracking-widest text-white/90">
              2026 대도시 캠페인
            </p>
            <h2 className="mb-4 text-5xl font-light leading-tight tracking-tight text-white">
              서울풍납 회중과
              <br />
              함께하는 봉사
            </h2>
            <p className="text-lg leading-relaxed text-white/85">
              캠페인 일정, 자료, 공지사항을
              <br />
              한 곳에서 빠르게 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </aside>

      <main className="relative flex w-full items-center justify-center px-5 py-8 sm:px-10 xl:w-[44%]">
        <div className="absolute inset-0 xl:hidden">
          <img
            src="https://images.unsplash.com/photo-1616059160527-7729f2da5b1c?auto=format&fit=crop&q=80&w=1000"
            alt="모바일 배경"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-[#f6f5f0]/90 backdrop-blur-xl" />
        </div>

        <section className="relative z-10 w-full max-w-md rounded-[28px] border border-[#ddd8cd] bg-white/90 p-6 shadow-xl shadow-[#066b6c]/10 backdrop-blur-sm sm:p-8">
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 text-[#066b6c]">
              <MapPin className="h-5 w-5" />
              <span className="text-xs font-black tracking-[0.15em]">서울풍납 회중</span>
            </div>
            <h1 className="mb-2 text-3xl font-black tracking-tight text-[#2d2a23]">환영합니다</h1>
            <p className="text-sm font-medium text-[#7a7568]">
              아이디와 비밀번호를 입력해 캠페인에 입장하세요.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-xs font-bold text-[#6f6a5f]">
                아이디
              </label>
              <div className="group flex items-center rounded-2xl border border-[#d8d4c9] bg-[#fbfaf7] px-3 transition focus-within:border-[#066b6c] focus-within:ring-4 focus-within:ring-[#066b6c]/10">
                <User className="h-4 w-4 text-[#9e998b] transition group-focus-within:text-[#066b6c]" />
                <input
                  id="username"
                  {...register('username')}
                  autoComplete="username"
                  className="w-full bg-transparent px-2 py-3.5 text-base text-[#2d2a23] outline-none md:text-sm"
                />
              </div>
              {errors.username && <p className="mt-1 text-xs font-semibold text-error">{errors.username.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-[#6f6a5f]">
                비밀번호
              </label>
              <div className="group flex items-center rounded-2xl border border-[#d8d4c9] bg-[#fbfaf7] px-3 transition focus-within:border-[#066b6c] focus-within:ring-4 focus-within:ring-[#066b6c]/10">
                <Lock className="h-4 w-4 text-[#9e998b] transition group-focus-within:text-[#066b6c]" />
                <input
                  id="password"
                  {...register('password')}
                  type="password"
                  autoComplete="current-password"
                  className="w-full bg-transparent px-2 py-3.5 text-base text-[#2d2a23] outline-none md:text-sm"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs font-semibold text-error">{errors.password.message}</p>}
            </div>

            {error && <p className="rounded-xl bg-error/10 px-3 py-2 text-xs font-semibold text-error">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#066b6c] py-3.5 text-sm font-black text-white transition hover:bg-[#045153] focus:outline-none focus:ring-4 focus:ring-[#066b6c]/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition duration-700 group-hover:translate-x-full" />
              {isSubmitting ? (
                <LoadingSpinner size="sm" label="확인 중..." className="[&>span:last-child]:text-white" />
              ) : (
                <>
                  <span className="relative">캠페인 로그인</span>
                  <ArrowRight className="relative h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
