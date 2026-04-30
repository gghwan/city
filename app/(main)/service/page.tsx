import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { deleteFileAction, getFiles, getSignedUrl, updateFileAction } from '@/actions/file.actions';
import { FileList } from '@/components/service/FileList';
import { FileUploadForm } from '@/components/service/FileUploadForm';

export default async function ServicePage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user.role === 'ADMIN';

  const rawFiles = await getFiles('service');
  const files = await Promise.all(
    rawFiles.map(async (file) => ({
      ...file,
      signedUrl: await getSignedUrl(file.storagePath),
    })),
  );

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
