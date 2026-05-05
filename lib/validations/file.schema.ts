import { z } from 'zod';

export const createFileSchema = z.object({
  type: z.enum(['SERVICE', 'EMERGENCY', 'TALK']),
  name: z.string().min(1, '파일명을 입력해주세요.').max(255),
  description: z.string().max(1000).optional().nullable(),
  storagePath: z.string().min(1),
  mimeType: z.string().default('application/octet-stream'),
  sizeBytes: z.number().int().positive().nullable().optional(),
});

export const updateFileSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional().nullable(),
});

export type CreateFileDto = z.infer<typeof createFileSchema>;
export type UpdateFileDto = z.infer<typeof updateFileSchema>;
