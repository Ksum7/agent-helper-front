import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { StreamEvent, ToolCallState } from '@/types';

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

export function eventsToState(events: StreamEvent[]): { thinking: string; tools: ToolCallState[] } {
  let thinking = '';
  const tools: ToolCallState[] = [];

  for (const event of events) {
    if (event.type === 'thinking') {
      thinking += event.content;
    } else if (event.type === 'tool_call') {
      const id = event.id ?? `tool_${tools.length}_${event.name}`;
      tools.push({ id, name: event.name, args: event.args, done: false });
    } else if (event.type === 'tool_result') {
      for (let i = tools.length - 1; i >= 0; i--) {
        if (tools[i].name === event.name && !tools[i].done) {
          tools[i] = { ...tools[i], result: event.content, done: true };
          break;
        }
      }
    }
  }

  return { thinking, tools };
}
