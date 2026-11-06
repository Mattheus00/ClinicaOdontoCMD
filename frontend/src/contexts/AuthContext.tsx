import axios from 'axios';
import { QueryClientProvider } from '@tanstack/react-query';
import { cacheScope, createAppQueryClient, disposeQueryClient } from '../lib/query-client';
import { preloadDestination } from '../lib/route-preload';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api, isInvalidSession, refreshAccessToken, setAuthHandlers, invalidateSessionRequests } from '../services/api';

type Role = 'ADMIN' | 'SECRETARY' | 'DENTIST';

interface AuthContextType {
  accessToken: string | null;
  role: Role | null;
  userId: string | null;
  clinicId: string | null;
  professionalId: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  sessionError: boolean;
  retrySession: () => void;
  login: (token: string) => void;
  logout: () => void;
}

function readTokenClaims(token: string): { role: Role | null; userId: string | null; clinicId: string | null; professionalId: string | null } {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      sub?: unknown;
      role?: unknown;
      professional_id?: unknown;
      clinic_id?: unknown;
    };
    const role =
      payload.role === 'ADMIN' || payload.role === 'SECRETARY' || payload.role === 'DENTIST'
        ? payload.role
        : null;
    const userId = typeof payload.sub === 'string' ? payload.sub : null;
    const professionalId = typeof payload.professional_id === 'string' ? payload.professional_id : null;
    const clinicId = typeof payload.clinic_id === 'string' ? payload.clinic_id : null;
    return { role, userId, clinicId, professionalId };
  } catch {
    return { role: null, userId: null, clinicId: null, professionalId: null };
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

const delay = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

async function restoreSession() {
  let lastError: unknown;

  // Proxy already waits up to 60s for cold start; keep client retries short.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await refreshAccessToken();
    } catch (error) {
      lastError = error;
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status !== undefined && status < 500) throw error;
      if (attempt < 1) await delay(300);
    }
  }

  throw lastError;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [queryClient, setQueryClient] = useState(() => createAppQueryClient('anonymous'));
  const cache = useRef({ scope: 'anonymous', client: queryClient });
  const switchCache = useCallback((scope: string) => {
    if (cache.current.scope === scope) return;
    disposeQueryClient(cache.current.client);
    const client = createAppQueryClient(scope);
    cache.current = { scope, client };
    setQueryClient(client);
  }, []);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessionError, setSessionError] = useState(false);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const retrySession = useCallback(() => { setSessionError(false); setIsInitializing(true); setRestoreAttempt(value => value + 1); }, []);
  const accessTokenRef = useRef<string | null>(null);

  const applyToken = useCallback((token: string) => {
    setSessionError(false);
    const claims = readTokenClaims(token);
    switchCache(cacheScope(claims));
    accessTokenRef.current = token;
    setAccessToken(token);
    setRole(claims.role);
    setUserId(claims.userId);
    setClinicId(claims.clinicId);
    setProfessionalId(claims.professionalId);
  }, [switchCache]);

  const login = useCallback((token: string) => {
    invalidateSessionRequests();
    applyToken(token);
  }, [applyToken]);

  const clearSession = useCallback(() => {
    invalidateSessionRequests();
    switchCache('anonymous');
    accessTokenRef.current = null;
    setAccessToken(null);
    setRole(null);
    setUserId(null);
    setClinicId(null);
    setProfessionalId(null);
  }, [switchCache]);

  const logout = useCallback(() => {
    clearSession();
    void api.post('/auth/logout', {}, { skipGlobalError: true }).catch(() => undefined);
  }, [clearSession]);

  useEffect(() => {
    setAuthHandlers({
      getAccessToken: () => accessTokenRef.current,
      setAccessToken: applyToken,
      logout,
    });

    return () => setAuthHandlers(null);
  }, [applyToken, logout]);

  useEffect(() => {
    let active = true;
    if (!['/', '/login', '/cadastro', '/register', '/confirmar-email'].includes(window.location.pathname) && !window.location.pathname.startsWith('/agendar/') && !window.location.pathname.startsWith('/convite/')) {
      preloadDestination(window.location.pathname);
    }

    restoreSession()
      .then((token) => {
        if (active && token && !accessTokenRef.current) applyToken(token);
      })
      .catch((error: unknown) => {
        if (!active || accessTokenRef.current || axios.isCancel(error)) return;
        if (isInvalidSession(error)) clearSession();
        else setSessionError(true);
      })
      .finally(() => {
        if (active) setIsInitializing(false);
      });

    return () => {
      active = false;
    };
  }, [applyToken, clearSession, restoreAttempt]);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        role,
        userId,
        clinicId,
        professionalId,
        isAuthenticated: Boolean(accessToken),
        isInitializing,
        sessionError,
        retrySession,
        login,
        logout,
      }}
    >
      <QueryClientProvider key={cache.current.scope} client={queryClient}>{children}</QueryClientProvider>
    </AuthContext.Provider>
  );
}
