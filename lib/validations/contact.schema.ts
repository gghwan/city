import { z } from 'zod';

export const createContactSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.').max(100),
  role: z.string().min(1, '역할을 입력해주세요.').max(100),
  phone: z.string().min(7, '전화번호를 입력해주세요.').max(20),
  note: z.string().max(1000).optional().nullable(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const updateContactSchema = createContactSchema.partial().extend({
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  phone: z.string().min(7).max(20),
});

export type CreateContactDto = z.infer<typeof createContactSchema>;
export type UpdateContactDto = z.infer<typeof updateContactSchema>;
