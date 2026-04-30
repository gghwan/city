'use client';

import { create } from 'zustand';
import type { FileItem } from '@/types';

type FileStore = {
  files: FileItem[];
  setFiles: (files: FileItem[]) => void;
};

export const useFileStore = create<FileStore>((set) => ({
  files: [],
  setFiles: (files) => set({ files }),
}));
