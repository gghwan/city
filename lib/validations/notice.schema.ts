import { z } from 'zod';

export const createNoticeSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').max(150),
  content: z.string().min(1, '내용을 입력해주세요.').max(5000),
  isPinned: z.boolean().optional().default(false),
});

export const updateNoticeSchema = createNoticeSchema.partial().extend({
  title: z.string().min(1).max(150),
  content: z.string().min(1).max(5000),
});

export type CreateNoticeDto = z.infer<typeof createNoticeSchema>;
export type UpdateNoticeDto = z.infer<typeof updateNoticeSchema>;
