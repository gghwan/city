import { z } from 'zod';

export const scheduleSessionKeySchema = z.enum(['AM', 'PM']);

export const applySlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionKey: scheduleSessionKeySchema,
  slotNo: z.coerce.number().int().min(1).max(999),
  note: z.string().max(300).optional().nullable(),
});

export const cancelApplicationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionKey: scheduleSessionKeySchema,
  applicationId: z.string().min(1),
});

export const removeApplicationAsAdminSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionKey: scheduleSessionKeySchema,
  applicationId: z.string().min(1),
});

export const assignApplicationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionKey: scheduleSessionKeySchema,
  slotNo: z.coerce.number().int().min(1).max(999),
  applicationId: z.string().min(1),
});

export const directAssignSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionKey: scheduleSessionKeySchema,
  slotNo: z.coerce.number().int().min(1).max(999),
  memberName: z.string().min(1).max(60),
});

export const clearSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionKey: scheduleSessionKeySchema,
  slotNo: z.coerce.number().int().min(1).max(999),
});

export const addSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionKey: scheduleSessionKeySchema,
});

export const deleteSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionKey: scheduleSessionKeySchema,
  slotNo: z.coerce.number().int().min(1).max(999),
});

export const updateSessionMemoSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionKey: scheduleSessionKeySchema,
  memo: z.string().max(2000),
});

export const updateGlobalNotesSchema = z.object({
  notes: z.array(z.string().max(300)).max(100),
});

export const updateSessionInfoSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionKey: scheduleSessionKeySchema,
  time: z.string().min(1).max(80),
  leader: z.string().max(60),
  zone: z.string().min(1).max(100),
});

export const createScheduleDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const deleteScheduleDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const createScheduleSessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionKey: scheduleSessionKeySchema,
  title: z.string().max(80).optional().nullable(),
  time: z.string().min(1).max(80),
  zone: z.string().min(1).max(100),
  leader: z.string().max(60).optional().nullable(),
});

export const deleteScheduleSessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionKey: scheduleSessionKeySchema,
});

export type ApplySlotDto = z.infer<typeof applySlotSchema>;
export type CancelApplicationDto = z.infer<typeof cancelApplicationSchema>;
export type RemoveApplicationAsAdminDto = z.infer<typeof removeApplicationAsAdminSchema>;
export type AssignApplicationDto = z.infer<typeof assignApplicationSchema>;
export type DirectAssignSlotDto = z.infer<typeof directAssignSlotSchema>;
export type ClearSlotDto = z.infer<typeof clearSlotSchema>;
export type AddSlotDto = z.infer<typeof addSlotSchema>;
export type DeleteSlotDto = z.infer<typeof deleteSlotSchema>;
export type UpdateSessionMemoDto = z.infer<typeof updateSessionMemoSchema>;
export type UpdateGlobalNotesDto = z.infer<typeof updateGlobalNotesSchema>;
export type UpdateSessionInfoDto = z.infer<typeof updateSessionInfoSchema>;
export type CreateScheduleDateDto = z.infer<typeof createScheduleDateSchema>;
export type DeleteScheduleDateDto = z.infer<typeof deleteScheduleDateSchema>;
export type CreateScheduleSessionDto = z.infer<typeof createScheduleSessionSchema>;
export type DeleteScheduleSessionDto = z.infer<typeof deleteScheduleSessionSchema>;
