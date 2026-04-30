import { create } from 'zustand';

export type ToastVariant = 'info' | 'success' | 'error';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, variant = 'info') => {
    const id = Math.random().toString(36).slice(2);
    set({ toasts: [...get().toasts, { id, message, variant }] });
    setTimeout(() => get().dismiss(id), 4000);
  },
  dismiss: (id) =>
    set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
