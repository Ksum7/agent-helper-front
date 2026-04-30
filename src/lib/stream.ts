import type { StreamEvent } from '@/types';
import { API_URL } from './utils';

export interface StreamOptions {
  onEvent: (event: StreamEvent) => void;
  onDone: () => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

export async function streamMessage(
  sessionId: string,
  content: string,
  opts: StreamOptions,
): Promise<void> {
  const { onEvent, onDone, onError, signal } = opts;

  try {
    const response = await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
      signal,
    });

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith('data:')) continue;
        const raw = line.slice(5).trim();
        if (!raw) continue;
        if (raw === '[DONE]') {
          onDone();
          return;
        }
        try {
          const event = JSON.parse(raw) as StreamEvent;
          onEvent(event);
        } catch {
          // ignore malformed line
        }
      }
    }
    onDone();
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      onDone();
      return;
    }
    onError(err as Error);
  }
}
