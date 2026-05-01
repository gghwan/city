import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { getMockState } from '@/lib/mock-db';
import { isSupabaseConfigured, storageBucket, supabaseAdmin } from '@/lib/supabase';

function sanitizeFilename(name: string) {
  return name.replace(/[\r\n"]/g, '').trim() || 'file';
}

type FileRecord = {
  id: number;
  name: string;
  storagePath: string;
  mimeType: string;
};

async function findFileById(id: number): Promise<FileRecord | null> {
  if (isDatabaseConfigured) {
    try {
      const file = await prisma.file.findUnique({
        where: { id },
        select: { id: true, name: true, storagePath: true, mimeType: true },
      });
      if (file) return file;
    } catch {
      // fallback below
    }
  }

  const state = getMockState();
  const file = state.files.find((item) => item.id === id);
  if (!file) return null;
  return {
    id: file.id,
    name: file.name,
    storagePath: file.storagePath,
    mimeType: file.mimeType,
  };
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return new Response('Invalid file id', { status: 400 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') === 'download' ? 'download' : 'open';
  const file = await findFileById(id);
  if (!file) {
    return new Response('File not found', { status: 404 });
  }

  if (file.storagePath.startsWith('http://') || file.storagePath.startsWith('https://')) {
    return Response.redirect(file.storagePath, 302);
  }

  if (!isSupabaseConfigured || !supabaseAdmin) {
    return new Response('Storage is not configured', { status: 503 });
  }

  const { data, error } = await supabaseAdmin.storage.from(storageBucket).download(file.storagePath);
  if (error || !data) {
    return new Response('Failed to fetch file', { status: 500 });
  }

  const filename = sanitizeFilename(file.name);
  const encodedFilename = encodeURIComponent(filename);
  const contentType = file.mimeType || data.type || 'application/octet-stream';
  const dispositionType = mode === 'download' ? 'attachment' : 'inline';
  const body = Buffer.from(await data.arrayBuffer());

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `${dispositionType}; filename*=UTF-8''${encodedFilename}`,
      'Cache-Control': 'private, no-store',
    },
  });
}
