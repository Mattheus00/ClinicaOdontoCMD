import type { AxiosError } from 'axios';

export function readApiError(error: unknown, fallback: string): string {
  const response = (error as AxiosError)?.response;
  const data = response?.data;

  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object') {
    if ('message' in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
    }
    const fieldMessages = Object.values(data as Record<string, unknown>)
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => value.trim());
    if (fieldMessages.length > 0) return fieldMessages.join(' ');
  }

  return fallback;
}
