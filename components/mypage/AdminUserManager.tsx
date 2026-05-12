'use client';

import { createUserByAdminAction, deleteUserByAdminAction } from '@/actions/user.actions';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/lib/format';

type AdminUserRow = {
  id: string;
  username: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
};

type AdminUserManagerProps = {
  users: AdminUserRow[];
  sessionBaseUsername: string;
  loadError: string | null;
};

export function AdminUserManager({ users, sessionBaseUsername, loadError }: AdminUserManagerProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-textBase">유저테이블 관리</h2>
        <p className="text-xs text-textMuted">로그인 가능한 사용자 계정을 추가/삭제할 수 있습니다. (비밀번호 고정: 191435)</p>
      </div>

      {loadError ? (
        <article className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3">
          <p className="text-xs font-semibold text-error">유저 목록을 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
          <p className="mt-1 text-[11px] text-error/80">{loadError}</p>
        </article>
      ) : null}

      <article className="rounded-2xl border border-borderColor bg-white p-4">
        <form action={createUserByAdminAction} className="flex flex-wrap items-end gap-2">
          <label className="min-w-[12rem] flex-1 text-xs font-semibold text-textMuted">
            사용자 이름
            <input
              name="username"
              required
              className="mt-1 w-full rounded-lg border border-borderColor px-3 py-2 text-sm text-textBase outline-none focus:border-primary"
            />
          </label>
          <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primaryHover">
            사용자 추가
          </button>
        </form>
      </article>

      <section className="space-y-2 rounded-2xl border border-borderColor bg-white p-4">
        <h3 className="text-sm font-black text-textBase">등록 사용자 ({users.length}명)</h3>
        {users.length === 0 ? (
          <EmptyState message="등록된 사용자가 없습니다." />
        ) : (
          <div className="space-y-2">
            {users.map((user) => {
              const isCurrentAdmin = user.username === sessionBaseUsername;
              return (
                <article key={user.id} className="flex items-center justify-between gap-2 rounded-xl border border-borderColor bg-surface px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-textBase">{user.username}</p>
                    <p className="text-[11px] text-textMuted">
                      역할 {user.role === 'ADMIN' ? '관리자' : '일반'} · 등록 {formatDate(user.createdAt)}
                    </p>
                  </div>
                  <form
                    action={deleteUserByAdminAction}
                    onSubmit={(event) => {
                      if (!window.confirm(`${user.username} 사용자를 삭제할까요?`)) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="id" value={user.id} />
                    <button
                      type="submit"
                      disabled={isCurrentAdmin}
                      className="rounded-lg bg-error/10 px-2.5 py-1.5 text-xs font-semibold text-error disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
