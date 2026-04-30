import { API_URL } from './utils';

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type Body = Record<string, unknown> | FormData | undefined;

async function request<T>(
  path: string,
  options: { method?: string; body?: Body; signal?: AbortSignal } = {},
): Promise<T> {
  const { method = 'GET', body, signal } = options;
  const isForm = body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    signal,
    headers: isForm
      ? undefined
      : body
        ? { 'Content-Type': 'application/json' }
        : undefined,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get('content-type') ?? '';

  if (!res.ok) {
    let message = res.statusText;
    let details: unknown;
    if (contentType.includes('application/json')) {
      try {
        const data = await res.json();
        details = data;
        if (Array.isArray(data?.message)) message = data.message.join('; ');
        else if (typeof data?.message === 'string') message = data.message;
      } catch {
        // ignore
      }
    }
    throw new ApiError(res.status, message, details);
  }

  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body?: Body, signal?: AbortSignal) =>
    request<T>(path, { method: 'POST', body, signal }),
  delete: <T>(path: string, signal?: AbortSignal) =>
    request<T>(path, { method: 'DELETE', signal }),
};
