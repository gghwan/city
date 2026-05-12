import { getServerSession } from 'next-auth';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { authOptions } from '@/lib/auth.config';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { getMockState } from '@/lib/mock-db';
import { isSupabaseConfigured, storageBucket, supabaseAdmin } from '@/lib/supabase';

function sanitizeFilename(name: string) {
  return name.replace(/[\r\n"]/g, '').trim() || 'file';
}

function normalizePublicStoragePath(storagePath: string) {
  const normalized = storagePath.replace(/\\/g, '/');
  if (!normalized.startsWith('/')) return null;
  if (normalized.includes('..')) return null;
  return normalized.replace(/^\/+/, '');
}

type FileRecord = {
  id: number;
  name: string;
  storagePath: string;
  mimeType: string;
};

function isLikelyFileContentType(contentType: string) {
  const normalized = contentType.toLowerCase();
  return (
    normalized.includes('application/pdf') ||
    normalized.startsWith('image/') ||
    normalized.startsWith('text/') ||
    normalized.includes('xml') ||
    normalized.includes('msword') ||
    normalized.includes('officedocument') ||
    normalized.includes('vnd.ms-excel') ||
    normalized.includes('vnd.ms-powerpoint') ||
    normalized.includes('application/octet-stream')
  );
}

async function findFileById(id: number): Promise<FileRecord | null> {
  const useMockDb = process.env.USE_MOCK_DB === 'true';

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('File')
      .select('id,name,storagePath,mimeType')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase 조회 실패: ${error.message}`);
    }

    return data
      ? {
          id: data.id as number,
          name: data.name as string,
          storagePath: data.storagePath as string,
          mimeType: data.mimeType as string,
        }
      : null;
  }

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

  if (!useMockDb) {
    return null;
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
  let file: FileRecord | null = null;
  try {
    file = await findFileById(id);
  } catch {
    return new Response('Failed to fetch file metadata', { status: 500 });
  }
  if (!file) {
    return new Response('File not found', { status: 404 });
  }

  if (file.storagePath.startsWith('http://') || file.storagePath.startsWith('https://')) {
    try {
      const remote = await fetch(file.storagePath, {
        method: 'GET',
        redirect: 'follow',
      });

      if (remote.ok) {
        const remoteType = remote.headers.get('content-type') || '';
        if (mode === 'download' || isLikelyFileContentType(remoteType) || isLikelyFileContentType(file.mimeType)) {
          const body = Buffer.from(await remote.arrayBuffer());
          const filename = sanitizeFilename(file.name);
          const encodedFilename = encodeURIComponent(filename);
          const contentType = remoteType || file.mimeType || 'application/octet-stream';
          const dispositionType = mode === 'download' ? 'attachment' : 'inline';

          return new Response(body, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `${dispositionType}; filename*=UTF-8''${encodedFilename}`,
              'Cache-Control': 'private, no-store',
            },
          });
        }
      }
    } catch {
      // fallback to redirect below
    }

    return Response.redirect(file.storagePath, 302);
  }

  const publicRelativePath = normalizePublicStoragePath(file.storagePath);
  if (publicRelativePath) {
    const absolutePath = path.join(process.cwd(), 'public', publicRelativePath);
    try {
      const body = await fs.readFile(absolutePath);
      const filename = sanitizeFilename(file.name);
      const encodedFilename = encodeURIComponent(filename);
      const contentType = file.mimeType || 'application/octet-stream';
      const dispositionType = mode === 'download' ? 'attachment' : 'inline';

      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `${dispositionType}; filename*=UTF-8''${encodedFilename}`,
          'Cache-Control': 'private, no-store',
        },
      });
    } catch {
      return new Response('File not found', { status: 404 });
    }
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
