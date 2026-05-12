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

export default async function ServicePage() {
  const session = await getCachedServerSession();
  const isAdmin = session?.user.role === 'ADMIN';

  const [contacts, serviceRaw, emergencyRaw] = await Promise.all([
    getContacts(),
    getFiles('service'),
    getFiles('emergency'),
  ]);

  const serviceFiles = isAdmin
    ? await (async () => {
        const signedUrls = await getSignedUrls(serviceRaw.map((file) => file.storagePath));
        return serviceRaw.map((file) => ({
          ...file,
          signedUrl: signedUrls[file.storagePath] ?? '#',
        }));
      })()
    : serviceRaw;

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
        <h2 className="text-lg font-black text-textBase">{isAdmin ? '봉사 안내 관리' : '봉사 안내'}</h2>
        <p className="text-xs text-textMuted">
          {isAdmin ? '봉사 마련과 비상 연락을 한 화면에서 관리하세요.' : '봉사 마련 자료와 비상 연락 정보를 확인하세요.'}
        </p>
      </div>

      <article className="rounded-2xl border border-borderColor bg-white p-3">
        <p className="text-xs font-semibold text-textMuted">섹션 바로가기</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <a href="#service-plan" className="rounded-lg bg-surface px-3 py-2 text-center text-xs font-bold text-textBase">
            봉사 마련
          </a>
          <a href="#emergency" className="rounded-lg bg-surface px-3 py-2 text-center text-xs font-bold text-textBase">
            비상 연락
          </a>
        </div>
      </article>

      <section id="service-plan" className="scroll-mt-24 space-y-3 rounded-2xl border border-borderColor bg-white p-4">
        <div>
          <h3 className="text-base font-black text-textBase">봉사 마련</h3>
          <p className="text-xs text-textMuted">게스트 봉사 배정 및 회중 봉사 마련 파일</p>
        </div>
        {isAdmin && <FileUploadForm type="SERVICE" />}
        <FileList files={serviceFiles} isAdmin={isAdmin} updateAction={updateFileAction} deleteAction={deleteFileAction} />
      </section>

      <section id="emergency" className="scroll-mt-24 space-y-3 rounded-2xl border border-borderColor bg-white p-4">
        <div>
          <h3 className="text-base font-black text-textBase">비상 연락</h3>
          <p className="text-xs text-textMuted">캠페인 담당자와 봉사 인도자 연락처 및 관련 파일</p>
        </div>
        {isAdmin ? (
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
        ) : null}
        <ContactList
          contacts={contacts}
          isAdmin={isAdmin}
          updateAction={updateContactAction}
          deleteAction={deleteContactAction}
        />
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-textBase">관련 파일</h4>
          {isAdmin && <FileUploadForm type="EMERGENCY" />}
          <FileList
            files={emergencyFiles}
            isAdmin={isAdmin}
            updateAction={updateFileAction}
            deleteAction={deleteFileAction}
          />
        </div>
      </section>
    </section>
  );
}
