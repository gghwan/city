import { z } from 'zod';

export const reportMinistryTypeSchema = z.enum(['CIRCUIT', 'SUBWAY']);
export const reportShiftSchema = z.enum(['AM', 'PM', '']);
export const reportStatusSchema = z.enum(['DRAFT', 'SUBMITTED']);

export const upsertReportSchema = z.object({
  status: reportStatusSchema.optional(),
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ministryType: reportMinistryTypeSchema,
  revisitCount: z.coerce.number().int().min(0).max(9999),
  contactExchangeCount: z.coerce.number().int().min(0).max(9999),
  visitRequestCount: z.coerce.number().int().min(0).max(9999),
  bibleStudyProposalCount: z.coerce.number().int().min(0).max(9999),
  bibleStudyStartCount: z.coerce.number().int().min(0).max(9999),
  subwayShift: reportShiftSchema,
  subwayLocation: z.string().max(100),
  magazineCount: z.coerce.number().int().min(0).max(9999),
  brochureCount: z.coerce.number().int().min(0).max(9999),
  subwayVisitRequestCount: z.coerce.number().int().min(0).max(9999),
  notes: z.string().max(4000),
  experienceServiceType: z.string().max(150),
  experienceType: z.string().max(300),
  experienceContent: z.string().max(6000),
});

export type UpsertReportDto = z.infer<typeof upsertReportSchema>;
