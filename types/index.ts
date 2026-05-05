export type Role = 'USER' | 'ADMIN';

export type FileType = 'SERVICE' | 'EMERGENCY' | 'TALK';

export interface SessionUser {
  id: string;
  username: string;
  role: Role;
}

export interface FileItem {
  id: number;
  type: FileType;
  name: string;
  description: string | null;
  storagePath: string;
  mimeType: string;
  sizeBytes: number | null;
  createdAt: string;
  signedUrl?: string;
}

export interface EmergencyContactItem {
  id: number;
  name: string;
  role: string;
  phone: string;
  note: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface LinkValue {
  url: string;
  updatedAt: string | null;
}

export interface LinkSet {
  map: LinkValue;
  card: LinkValue;
  talk: LinkValue;
}

export interface NoticeItem {
  id: number;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

export interface AppMessage {
  role: 'user' | 'assistant';
  content: string;
}
