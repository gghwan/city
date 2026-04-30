import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { deleteFileAction, getFiles, getSignedUrls, updateFileAction } from '@/actions/file.actions';
import { FileList } from '@/components/service/FileList';
import { FileUploadForm } from '@/components/service/FileUploadForm';

export default async function ServicePage() {
  const [session, rawFiles] = await Promise.all([getServerSession(authOptions), getFiles('service')]);
  const isAdmin = session?.user.role === 'ADMIN';

  const signedUrls = await getSignedUrls(rawFiles.map((file) => file.storagePath));
  const files = rawFiles.map((file) => ({
    ...file,
    signedUrl: signedUrls[file.storagePath] ?? '#',
  }));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-textBase">봉사 마련</h2>
        <p className="text-xs text-textMuted">업로드된 자료를 확인하세요.</p>
      </div>

      {isAdmin && <FileUploadForm type="SERVICE" />}
      <FileList files={files} isAdmin={isAdmin} updateAction={updateFileAction} deleteAction={deleteFileAction} />
    </section>
  );
}
