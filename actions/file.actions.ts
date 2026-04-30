'use server';

import { revalidatePath } from 'next/cache';
import { FileType } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { withAdminAction } from '@/lib/with-admin';
import { AppError } from '@/lib/errors';
import { createFileSchema, updateFileSchema, type CreateFileDto, type UpdateFileDto } from '@/lib/validations/file.schema';
import { getMockState } from '@/lib/mock-db';
import type { FileItem } from '@/types';
import { isSupabaseConfigured, storageBucket, supabaseAdmin } from '@/lib/supabase';
import { ALLOWED_UPLOAD_EXTENSIONS, MAX_UPLOAD_SIZE_BYTES } from '@/lib/constants';
import { uploadRateLimiter } from '@/lib/rate-limiter';

function fileTypeToPrisma(type: 'service' | 'emergency') {
  return type === 'service' ? FileType.SERVICE : FileType.EMERGENCY;
}

const allowedExtensionSet = new Set(ALLOWED_UPLOAD_EXTENSIONS);

const allowedMimeTypeSet = new Set([
  'application/pdf',
  'application/xml',
  'text/xml',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/x-hwp',
  'application/haansofthwp',
  'application/vnd.hancom.hwp',
  'application/hwp+zip',
  'application/haansofthwpx',
  'application/vnd.hancom.hwpx',
  'text/plain',
  'text/csv',
]);

function getFileExtension(filename: string) {
  const idx = filename.lastIndexOf('.');
  if (idx < 0) return '';
  return filename.slice(idx + 1).toLowerCase();
}

function isAllowedUploadFile(file: File) {
  const extension = getFileExtension(file.name);
  const mimeType = file.type.toLowerCase();

  if (allowedExtensionSet.has(extension as (typeof ALLOWED_UPLOAD_EXTENSIONS)[number])) {
    return true;
  }

  if (mimeType.startsWith('image/')) {
    return true;
  }

  if (allowedMimeTypeSet.has(mimeType)) {
    return true;
  }

  return false;
}

function mapToClient(record: {
  id: number;
  type: FileType;
  name: string;
  description: string | null;
  storagePath: string;
  mimeType: string;
  sizeBytes: bigint | number | null;
  createdAt: Date | string;
}): FileItem {
  return {
    id: record.id,
    type: record.type,
    name: record.name,
    description: record.description,
    storagePath: record.storagePath,
    mimeType: record.mimeType,
    sizeBytes:
      typeof record.sizeBytes === 'bigint'
        ? Number(record.sizeBytes)
        : typeof record.sizeBytes === 'number'
        ? record.sizeBytes
        : null,
    createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
  };
}

export async function getSignedUrl(storagePath: string): Promise<string> {
  if (!storagePath) return '#';
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) return storagePath;

  if (!isSupabaseConfigured || !supabaseAdmin) {
    return '#';
  }

  const { data, error } = await supabaseAdmin.storage.from(storageBucket).createSignedUrl(storagePath, 60 * 15);

  if (error || !data?.signedUrl) {
    return '#';
  }

  return data.signedUrl;
}

export async function getFiles(type: 'service' | 'emergency'): Promise<FileItem[]> {
  const prismaType = fileTypeToPrisma(type);

  if (isDatabaseConfigured) {
    try {
      const files = await prisma.file.findMany({
        where: { type: prismaType },
        orderBy: { createdAt: 'desc' },
      });
      return files.map(mapToClient);
    } catch {
      // fallback below
    }
  }

  const state = getMockState();
  return state.files
    .filter((file) => file.type === prismaType)
    .sort((a, b) => b.id - a.id)
    .map((item) => ({ ...item }));
}

export async function createFile(dto: CreateFileDto): Promise<FileItem> {
  return withAdminAction(async (session) => {
    const parsed = createFileSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    if (isDatabaseConfigured) {
      try {
        const created = await prisma.file.create({
          data: {
            ...parsed.data,
            sizeBytes:
              typeof parsed.data.sizeBytes === 'number' ? BigInt(parsed.data.sizeBytes) : parsed.data.sizeBytes ?? null,
            uploadedBy: Number.isFinite(Number(session.user.id)) ? Number(session.user.id) : undefined,
          },
        });

        return mapToClient(created);
      } catch {
        // fallback below
      }
    }

    const state = getMockState();
    const created: FileItem = {
      id: state.nextFileId++,
      type: parsed.data.type,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      storagePath: parsed.data.storagePath,
      mimeType: parsed.data.mimeType,
      sizeBytes: parsed.data.sizeBytes ?? null,
      createdAt: new Date().toISOString(),
    };

    state.files.unshift(created);
    return created;
  });
}

export async function updateFile(id: number, dto: UpdateFileDto): Promise<FileItem> {
  return withAdminAction(async () => {
    const parsed = updateFileSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    if (isDatabaseConfigured) {
      try {
        const updated = await prisma.file.update({
          where: { id },
          data: parsed.data,
        });
        return mapToClient(updated);
      } catch {
        // fallback below
      }
    }

    const state = getMockState();
    const target = state.files.find((file) => file.id === id);
    if (!target) {
      throw new AppError('E004', '파일을 찾을 수 없습니다.', 404);
    }

    target.name = parsed.data.name;
    target.description = parsed.data.description ?? null;
    return { ...target };
  });
}

export async function deleteFile(id: number): Promise<void> {
  await withAdminAction(async () => {
    if (isDatabaseConfigured) {
      try {
        const target = await prisma.file.findUnique({ where: { id } });
        if (!target) {
          throw new AppError('E004', '파일을 찾을 수 없습니다.', 404);
        }

        await prisma.file.delete({ where: { id } });

        if (isSupabaseConfigured && supabaseAdmin && target.storagePath && !target.storagePath.startsWith('http')) {
          await supabaseAdmin.storage.from(storageBucket).remove([target.storagePath]);
        }
        return;
      } catch (error) {
        if (error instanceof AppError) throw error;
      }
    }

    const state = getMockState();
    state.files = state.files.filter((file) => file.id !== id);
  });
}

export async function uploadFileAction(formData: FormData) {
  return withAdminAction(async (session) => {
    const type = formData.get('type');
    const name = formData.get('name');
    const description = formData.get('description');
    const file = formData.get('file');

    if (type !== 'SERVICE' && type !== 'EMERGENCY') {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    if (typeof name !== 'string' || !name.trim()) {
      throw new AppError('E007', '파일명을 입력해주세요.', 422);
    }

    if (!(file instanceof File)) {
      throw new AppError('E007', '업로드할 파일을 선택해주세요.', 422);
    }

    const rateKey = session.user.username || 'upload';
    const limit = await uploadRateLimiter.limit(rateKey);
    if (!limit.success) {
      throw new AppError('E008', '잠시 후 다시 시도해주세요.', 429);
    }

    if (!isAllowedUploadFile(file)) {
      throw new AppError('E006', '이미지/PDF/XML 및 문서 파일(docx, hwpx, pptx 등)만 업로드 가능합니다.', 415);
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new AppError('E005', '파일 크기는 50MB를 초과할 수 없습니다.', 413);
    }

    let storagePath = `local/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

    if (isSupabaseConfigured && supabaseAdmin) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-가-힣]/g, '-');
      storagePath = `${type.toLowerCase()}/${Date.now()}-${safeName}`;

      const { error } = await supabaseAdmin.storage.from(storageBucket).upload(storagePath, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

      if (error) {
        throw new AppError('E009', '업로드에 실패했습니다. 잠시 후 다시 시도해주세요.', 500);
      }
    }

    await createFile({
      type,
      name: name.trim(),
      description: typeof description === 'string' && description.trim() ? description.trim() : null,
      storagePath,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    });

    revalidatePath('/service');
    revalidatePath('/emergency');
  });
}

export async function deleteFileAction(formData: FormData) {
  const id = Number(formData.get('id'));
  if (!Number.isFinite(id)) {
    throw new AppError('E007', '입력값을 확인해주세요.', 422);
  }

  await deleteFile(id);
  revalidatePath('/service');
  revalidatePath('/emergency');
}

export async function updateFileAction(formData: FormData) {
  const id = Number(formData.get('id'));
  const name = formData.get('name');
  const description = formData.get('description');

  if (!Number.isFinite(id) || typeof name !== 'string' || !name.trim()) {
    throw new AppError('E007', '입력값을 확인해주세요.', 422);
  }

  await updateFile(id, {
    name: name.trim(),
    description: typeof description === 'string' && description.trim() ? description.trim() : null,
  });

  revalidatePath('/service');
  revalidatePath('/emergency');
}
