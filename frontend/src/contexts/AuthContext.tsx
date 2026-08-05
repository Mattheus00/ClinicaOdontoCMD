import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { refreshAccessToken, setAuthHandlers } from '../services/api';

type Role = 'ADMIN' | 'SECRETARY' | 'DENTIST';

interface AuthContextType {
  accessToken: string | null;
  role: Role | null;
  professionalId: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (token: string) => void;
  logout: () => void;
}

function readTokenClaims(token: string): { role: Role | null; professionalId: string | null } {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      role?: unknown;
      professional_id?: unknown;
    };
    const role =
      payload.role === 'ADMIN' || payload.role === 'SECRETARY' || payload.role === 'DENTIST'
        ? payload.role
        : null;
    const professionalId = typeof payload.professional_id === 'string' ? payload.professional_id : null;
    return { role, professionalId };
  } catch {
    return { role: null, professionalId: null };
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const accessTokenRef = useRef<string | null>(null);

  const applyToken = useCallback((token: string) => {
    const claims = readTokenClaims(token);
    accessTokenRef.current = token;
    setAccessToken(token);
    setRole(claims.role);
    setProfessionalId(claims.professionalId);
  }, []);

  const login = useCallback((token: string) => {
    applyToken(token);
  }, [applyToken]);

  const logout = useCallback(() => {
    accessTokenRef.current = null;
    setAccessToken(null);
    setRole(null);
    setProfessionalId(null);
  }, []);

  useEffect(() => {
    setAuthHandlers({
      getAccessToken: () => accessTokenRef.current,
      setAccessToken: login,
      logout,
    });

    return () => setAuthHandlers(null);
  }, [login, logout]);

  useEffect(() => {
    let active = true;

    refreshAccessToken()
      .then((token) => {
        if (active && token) applyToken(token);
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        if (active) setIsInitializing(false);
      });

    return () => {
      active = false;
    };
  }, [applyToken, logout]);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        role,
        professionalId,
        isAuthenticated: Boolean(accessToken),
        isInitializing,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
