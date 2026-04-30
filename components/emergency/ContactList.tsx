import type { EmergencyContactItem } from '@/types';
import { Phone, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';

export function ContactList({
  contacts,
  isAdmin,
  updateAction,
  deleteAction,
}: {
  contacts: EmergencyContactItem[];
  isAdmin: boolean;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  if (!contacts.length) {
    return <EmptyState message="등록된 연락처가 없습니다" />;
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact) => (
        <article key={contact.id} className="rounded-2xl border border-borderColor bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-textBase">{contact.name}</h3>
              <p className="text-xs text-textMuted">{contact.role}</p>
            </div>
            <a
              href={`tel:${contact.phone}`}
              className="inline-flex items-center gap-1 rounded-lg bg-success px-2 py-1.5 text-xs font-semibold text-white"
            >
              <Phone className="h-3.5 w-3.5" />
              전화
            </a>
          </div>

          <p className="mt-2 text-xs font-semibold text-textBase">{contact.phone}</p>
          {contact.note && <p className="mt-1 text-xs text-textMuted">{contact.note}</p>}

          {isAdmin && (
            <div className="mt-3 space-y-2 border-t border-borderColor pt-3">
              <form action={updateAction} className="grid gap-2 sm:grid-cols-2">
                <input type="hidden" name="id" value={contact.id} />
                <input
                  name="name"
                  defaultValue={contact.name}
                  className="rounded-lg border border-borderColor px-2 py-1.5 text-xs outline-none focus:border-primary"
                  required
                />
                <input
                  name="role"
                  defaultValue={contact.role}
                  className="rounded-lg border border-borderColor px-2 py-1.5 text-xs outline-none focus:border-primary"
                  required
                />
                <input
                  name="phone"
                  defaultValue={contact.phone}
                  className="rounded-lg border border-borderColor px-2 py-1.5 text-xs outline-none focus:border-primary"
                  required
                />
                <input
                  name="note"
                  defaultValue={contact.note ?? ''}
                  className="rounded-lg border border-borderColor px-2 py-1.5 text-xs outline-none focus:border-primary"
                />
                <button type="submit" className="rounded-lg bg-surface px-2 py-1.5 text-xs font-semibold">
                  수정 저장
                </button>
              </form>

              <form action={deleteAction}>
                <input type="hidden" name="id" value={contact.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-error/10 px-2 py-1.5 text-xs font-semibold text-error"
                >
                  <Trash2 className="h-3.5 w-3.5" /> 삭제
                </button>
              </form>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
