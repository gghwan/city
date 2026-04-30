import { z } from 'zod';

export const updateLinkSchema = z.object({
  type: z.enum(['map', 'card']),
  url: z.string().url('유효한 URL을 입력해주세요.'),
});
