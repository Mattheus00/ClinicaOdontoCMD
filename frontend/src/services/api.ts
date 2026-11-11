import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { readApiError } from '../lib/api-error';
import { notifyInfo } from '../lib/notify';

const configuredApiBaseUrl = import.meta.env.VITE_API_URL ?? '/api';
if (import.meta.env.PROD && configuredApiBaseUrl.startsWith('http:')) {
  throw new Error('A API deve usar HTTPS em ambientes de produção.');
}
const apiBaseUrl = configuredApiBaseUrl;

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 70_000,
});

export function isInvalidSession(error: unknown) {
  return axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403);
}

type AuthHandlers = {
  getAccessToken: () => string | null;
  setAccessToken: (token: string) => void;
  logout: () => void;
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _sessionGeneration?: number;
  skipGlobalError?: boolean;
  _slowTimer?: ReturnType<typeof setTimeout>;
  _slowNotified?: boolean;
};

const SLOW_REQUEST_MS = 10_000;

function clearSlowRequestTimer(config?: RetriableRequestConfig) {
  if (!config?._slowTimer) return;
  clearTimeout(config._slowTimer);
  config._slowTimer = undefined;
}

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
let sessionGeneration = 0;
export function invalidateSessionRequests() {
  sessionGeneration += 1;
  refreshPromise = null;
}

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
    const previousAccessToken = authHandlers?.getAccessToken();
    const generation = sessionGeneration;
    const pending: Promise<string> = axios
      .post(`${apiBaseUrl}/auth/refresh`, {}, { withCredentials: true, timeout: 70_000 })
      .then((response) => {
        if (generation !== sessionGeneration) throw new axios.CanceledError('Session changed');
        const token = readAccessToken(response.data);
        if (!token) throw new Error('A API nao retornou um access token ao renovar a sessao.');
        if (authHandlers?.getAccessToken() === previousAccessToken) authHandlers?.setAccessToken(token);
        return token;
      })
      .finally(() => {
        if (refreshPromise === pending) refreshPromise = null;
      });
    refreshPromise = pending;
  }

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const cfg = config as RetriableRequestConfig;
  cfg._sessionGeneration = sessionGeneration;
  cfg._slowTimer = setTimeout(() => {
    if (!cfg._slowNotified) {
      cfg._slowNotified = true;
      notifyInfo('Ainda processando…');
    }
  }, SLOW_REQUEST_MS);
  if (!isPublicApiPath(config.url ?? '')) {
    const token = authHandlers?.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    clearSlowRequestTimer(response.config as RetriableRequestConfig);
    if ((response.config as RetriableRequestConfig)._sessionGeneration !== sessionGeneration)
      return Promise.reject(new axios.CanceledError('Session changed'));
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    clearSlowRequestTimer(originalRequest);
    const requestPath = originalRequest?.url ?? '';
    if (originalRequest && originalRequest._sessionGeneration !== sessionGeneration)
      return Promise.reject(new axios.CanceledError('Session changed'));

    if (axios.isCancel(error)) return Promise.reject(error);

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
        if (axios.isCancel(refreshError)) return Promise.reject(refreshError);
        if (isInvalidSession(refreshError)) authHandlers?.logout();
        else window.dispatchEvent(new CustomEvent('app:session-unavailable'));
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
