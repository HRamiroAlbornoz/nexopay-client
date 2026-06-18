import { createContext, useState, useEffect, type ReactNode } from 'react';
import { z } from 'zod';
import { API_BASE_URL } from '../lib/apiConfig';

const SESSION_HINT_KEY = 'nexopay_session';

// eslint-disable-next-line react-refresh/only-export-components -- Zod schema is exported for reuse in other modules; not a React component
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.email(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.enum(['user', 'admin']).optional().default('user'),
});

export type User = z.infer<typeof userSchema>;

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (user: User) => void;
  logout: () => void;
  googleReady: boolean;
  googleClientId: string | undefined;
  isAdmin: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components -- Context and Provider are intentionally co-located; Vite HMR limitation
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [googleReady, setGoogleReady] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  // Load Google Identity Services script
  useEffect(() => {
    if (!googleClientId) return;

    // Check if script is already present
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      if (window.google?.accounts?.id) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- called once synchronously when script already loaded; no cascading renders
        setGoogleReady(true);
      } else {
        existing.addEventListener('load', () => setGoogleReady(true), { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleReady(true);
    script.onerror = () => setGoogleReady(false);
    document.head.appendChild(script);
  }, [googleClientId]);

  // Session check on mount
  useEffect(() => {
    if (!localStorage.getItem(SESSION_HINT_KEY)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- guard-clause: sets state once and returns immediately; no cascading renders
      setStatus('unauthenticated');
      return;
    }

    const controller = new AbortController();

    async function checkSession(): Promise<void> {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok) {
          localStorage.removeItem(SESSION_HINT_KEY);
          setStatus('unauthenticated');
          return;
        }

        const raw: unknown = await response.json();
        const parsed = userSchema.safeParse(raw);

        if (parsed.success) {
          setUser(parsed.data);
          setStatus('authenticated');
        } else {
          localStorage.removeItem(SESSION_HINT_KEY);
          setStatus('unauthenticated');
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          localStorage.removeItem(SESSION_HINT_KEY);
          setStatus('unauthenticated');
        }
      }
    }

    void checkSession();
    return () => controller.abort();
  }, []);

  function login(newUser: User): void {
    localStorage.setItem(SESSION_HINT_KEY, '1');
    setUser(newUser);
    setStatus('authenticated');
  }

  function logout(): void {
    localStorage.removeItem(SESSION_HINT_KEY);
    setUser(null);
    setStatus('unauthenticated');
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }

  // Helper temporal para demo: si el email contiene "admin" o el rol es admin
  const isAdmin = user?.role === 'admin' || user?.email.includes('admin') || user?.email === 'nexo.paybussiness@gmail.com';

  return (
    <AuthContext.Provider value={{ user, status, login, logout, googleReady, googleClientId, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

