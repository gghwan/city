'use server';

import { revalidatePath } from 'next/cache';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { withAdminAction } from '@/lib/with-admin';
import { AppError } from '@/lib/errors';
import {
  createContactSchema,
  updateContactSchema,
  type CreateContactDto,
  type UpdateContactDto,
} from '@/lib/validations/contact.schema';
import { getMockState } from '@/lib/mock-db';
import type { EmergencyContactItem } from '@/types';

function mapToClient(record: {
  id: number;
  name: string;
  role: string;
  phone: string;
  note: string | null;
  sortOrder: number;
  createdAt: Date | string;
}): EmergencyContactItem {
  return {
    id: record.id,
    name: record.name,
    role: record.role,
    phone: record.phone,
    note: record.note,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
  };
}

export async function getContacts(): Promise<EmergencyContactItem[]> {
  if (isDatabaseConfigured) {
    try {
      const contacts = await prisma.emergencyContact.findMany({
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      });
      return contacts.map(mapToClient);
    } catch {
      // fallback below
    }
  }

  const state = getMockState();
  return state.contacts.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((item) => ({ ...item }));
}

export async function createContact(dto: CreateContactDto): Promise<EmergencyContactItem> {
  return withAdminAction(async (session) => {
    const parsed = createContactSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    if (isDatabaseConfigured) {
      try {
        const created = await prisma.emergencyContact.create({
          data: {
            name: parsed.data.name,
            role: parsed.data.role,
            phone: parsed.data.phone,
            note: parsed.data.note ?? null,
            sortOrder: parsed.data.sortOrder ?? 0,
            createdBy: Number.isFinite(Number(session.user.id)) ? Number(session.user.id) : undefined,
          },
        });
        return mapToClient(created);
      } catch {
        // fallback below
      }
    }

    const state = getMockState();
    const created: EmergencyContactItem = {
      id: state.nextContactId++,
      name: parsed.data.name,
      role: parsed.data.role,
      phone: parsed.data.phone,
      note: parsed.data.note ?? null,
      sortOrder: parsed.data.sortOrder ?? state.contacts.length + 1,
      createdAt: new Date().toISOString(),
    };

    state.contacts.push(created);
    return created;
  });
}

export async function updateContact(id: number, dto: UpdateContactDto): Promise<EmergencyContactItem> {
  return withAdminAction(async () => {
    const parsed = updateContactSchema.safeParse(dto);
    if (!parsed.success) {
      throw new AppError('E007', '입력값을 확인해주세요.', 422);
    }

    if (isDatabaseConfigured) {
      try {
        const updated = await prisma.emergencyContact.update({
          where: { id },
          data: {
            name: parsed.data.name,
            role: parsed.data.role,
            phone: parsed.data.phone,
            note: parsed.data.note ?? null,
          },
        });
        return mapToClient(updated);
      } catch {
        // fallback below
      }
    }

    const state = getMockState();
    const target = state.contacts.find((item) => item.id === id);
    if (!target) {
      throw new AppError('E004', '연락처를 찾을 수 없습니다.', 404);
    }

    target.name = parsed.data.name;
    target.role = parsed.data.role;
    target.phone = parsed.data.phone;
    target.note = parsed.data.note ?? null;
    return { ...target };
  });
}

export async function deleteContact(id: number): Promise<void> {
  await withAdminAction(async () => {
    if (isDatabaseConfigured) {
      try {
        await prisma.emergencyContact.delete({ where: { id } });
        return;
      } catch {
        // fallback below
      }
    }

    const state = getMockState();
    state.contacts = state.contacts.filter((item) => item.id !== id);
  });
}

export async function reorderContacts(orderedIds: number[]): Promise<void> {
  await withAdminAction(async () => {
    if (isDatabaseConfigured) {
      try {
        await Promise.all(
          orderedIds.map((id, index) =>
            prisma.emergencyContact.update({
              where: { id },
              data: { sortOrder: index + 1 },
            }),
          ),
        );
        return;
      } catch {
        // fallback below
      }
    }

    const state = getMockState();
    const idToOrder = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
    state.contacts = state.contacts
      .map((contact) => ({ ...contact, sortOrder: idToOrder.get(contact.id) ?? contact.sortOrder }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  });
}

export async function createContactAction(formData: FormData) {
  await createContact({
    name: String(formData.get('name') || ''),
    role: String(formData.get('role') || ''),
    phone: String(formData.get('phone') || ''),
    note: String(formData.get('note') || '') || null,
  });

  revalidatePath('/emergency');
}

export async function updateContactAction(formData: FormData) {
  const id = Number(formData.get('id'));
  if (!Number.isFinite(id)) {
    throw new AppError('E007', '입력값을 확인해주세요.', 422);
  }

  await updateContact(id, {
    name: String(formData.get('name') || ''),
    role: String(formData.get('role') || ''),
    phone: String(formData.get('phone') || ''),
    note: String(formData.get('note') || '') || null,
  });

  revalidatePath('/emergency');
}

export async function deleteContactAction(formData: FormData) {
  const id = Number(formData.get('id'));
  if (!Number.isFinite(id)) {
    throw new AppError('E007', '입력값을 확인해주세요.', 422);
  }

  await deleteContact(id);
  revalidatePath('/emergency');
}
