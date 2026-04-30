import { api } from '@/lib/api';
import type { User } from '@/types';

export const authApi = {
  me: () => api.get<User>('/auth/me'),
  login: (email: string, password: string) =>
    api.post<{ ok: true }>('/auth/login', { email, password }),
  register: (email: string, password: string) =>
    api.post<{ ok: true }>('/auth/register', { email, password }),
  logout: () => api.post<{ ok: true }>('/auth/logout'),
};
