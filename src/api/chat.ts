import { api } from '@/lib/api';
import type { ChatSession, Message } from '@/types';

export const chatApi = {
  listSessions: () => api.get<ChatSession[]>('/chat/sessions'),
  getSession: (id: string) => api.get<ChatSession>(`/chat/sessions/${id}`),
  createSession: (title: string) =>
    api.post<ChatSession>('/chat/sessions', { title }),
  deleteSession: (id: string) => api.delete<void>(`/chat/sessions/${id}`),
  listMessages: (id: string) =>
    api.get<Message[]>(`/chat/sessions/${id}/messages`),
};
