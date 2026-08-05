import type { AxiosError } from 'axios';

export function readApiError(error: unknown, fallback: string): string {
  const response = (error as AxiosError)?.response;
  const data = response?.data;

  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }

  return fallback;
}
