import { api } from '@/lib/api';
import { API_URL } from '@/lib/utils';
import type { FileRecord } from '@/types';

export const filesApi = {
  list: () => api.get<FileRecord[]>('/files'),
  listBySession: (sessionId: string) =>
    api.get<FileRecord[]>(`/files?sessionId=${encodeURIComponent(sessionId)}`),
  upload: (file: File, sessionId?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    const qs = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
    return api.post<FileRecord>(`/files${qs}`, fd);
  },
  delete: (id: string) => api.delete<unknown>(`/files/${id}`),
  downloadUrl: (id: string) => `${API_URL}/files/${id}`,
};
