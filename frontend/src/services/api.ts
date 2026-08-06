import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { readApiError } from '../lib/api-error';

const configuredApiBaseUrl = import.meta.env.VITE_API_URL ?? '/api';
if (import.meta.env.PROD && configuredApiBaseUrl.startsWith('http:')) {
  throw new Error('A API deve usar HTTPS em ambientes de produção.');
}
const apiBaseUrl = configuredApiBaseUrl;

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

type AuthHandlers = {
  getAccessToken: () => string | null;
  setAccessToken: (token: string) => void;
  logout: () => void;
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipGlobalError?: boolean;
};

const publicPaths = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/confirm-email',
  '/auth/refresh',
  '/auth/logout',
]);

function isPublicApiPath(path: string) {
  const normalized = path.split('?')[0] ?? '';
  return publicPaths.has(normalized) || normalized.startsWith('/public/');
}

let authHandlers: AuthHandlers | null = null;
let refreshPromise: Promise<string> | null = null;

/** Connects the HTTP client to the in-memory auth store. */
export function setAuthHandlers(handlers: AuthHandlers | null) {
  authHandlers = handlers;
}

function readAccessToken(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;

  const data = payload as Record<string, unknown>;
  const token = data.accessToken ?? data.access_token;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

/**
 * Uses only the httpOnly refresh cookie to obtain a short-lived access token.
 * A shared promise prevents a burst of 401 responses from opening multiple
 * refresh requests at the same time.
 */
export async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${apiBaseUrl}/auth/refresh`, {}, { withCredentials: true })
      .then((response) => {
        const token = readAccessToken(response.data);
        if (!token) throw new Error('A API nao retornou um access token ao renovar a sessao.');
        authHandlers?.setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  if (!isPublicApiPath(config.url ?? '')) {
    const token = authHandlers?.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const requestPath = originalRequest?.url ?? '';

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isPublicApiPath(requestPath)
    ) {
      originalRequest._retry = true;

      try {
        const token = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        authHandlers?.logout();
        return Promise.reject(refreshError);
      }
    }

    const skipToast =
      Boolean(originalRequest?.skipGlobalError) ||
      isPublicApiPath(requestPath) ||
      requestPath.startsWith('/public/');

    if (!skipToast) {
      if (error.response?.status === 403) {
        window.dispatchEvent(
          new CustomEvent('app:api-error', {
            detail: { message: 'Você não tem permissão para realizar esta ação.' },
          }),
        );
      } else if (error.response) {
        const message = readApiError(
          error,
          error.response.status >= 500
            ? 'O serviço está indisponível no momento. Tente novamente.'
            : 'Não foi possível concluir a operação.',
        );
        window.dispatchEvent(new CustomEvent('app:api-error', { detail: { message } }));
      }
    }

    return Promise.reject(error);
  },
);
