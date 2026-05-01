import {
  createContactAction,
  deleteContactAction,
  getContacts,
  updateContactAction,
} from '@/actions/contact.actions';
import { deleteFileAction, getFiles, getSignedUrls, updateFileAction } from '@/actions/file.actions';
import { ContactList } from '@/components/emergency/ContactList';
import { FileList } from '@/components/service/FileList';
import { FileUploadForm } from '@/components/service/FileUploadForm';
import { getCachedServerSession } from '@/lib/session';

export default async function EmergencyPage() {
  const [session, contacts, emergencyRaw] = await Promise.all([
    getCachedServerSession(),
    getContacts(),
    getFiles('emergency'),
  ]);
  const isAdmin = session?.user.role === 'ADMIN';

  const emergencyFiles = isAdmin
    ? await (async () => {
        const signedUrls = await getSignedUrls(emergencyRaw.map((file) => file.storagePath));
        return emergencyRaw.map((file) => ({
          ...file,
          signedUrl: signedUrls[file.storagePath] ?? '#',
        }));
      })()
    : emergencyRaw;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-textBase">비상 연락</h2>
        <p className="text-xs text-textMuted">담당자 및 봉사 인도자 연락처</p>
      </div>

      {isAdmin && (
        <form action={createContactAction} className="grid gap-2 rounded-2xl border border-borderColor bg-white p-4 sm:grid-cols-2">
          <input
            name="name"
            placeholder="이름"
            className="rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary"
            required
          />
          <input
            name="role"
            placeholder="역할"
            className="rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary"
            required
          />
          <input
            name="phone"
            placeholder="전화번호"
            className="rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary"
            required
          />
          <input
            name="note"
            placeholder="비고"
            className="rounded-lg border border-borderColor px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primaryHover">
            연락처 추가
          </button>
        </form>
      )}

      <ContactList
        contacts={contacts}
        isAdmin={isAdmin}
        updateAction={updateContactAction}
        deleteAction={deleteContactAction}
      />

      <div className="space-y-2">
        <h3 className="text-sm font-bold text-textBase">관련 파일</h3>
        {isAdmin && <FileUploadForm type="EMERGENCY" />}
        <FileList
          files={emergencyFiles}
          isAdmin={isAdmin}
          updateAction={updateFileAction}
          deleteAction={deleteFileAction}
        />
      </div>
    </section>
  );
}
