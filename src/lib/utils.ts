import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 7 * day) {
    return d.toLocaleDateString('ru-RU', { weekday: 'short' });
  }
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

export const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3000';
