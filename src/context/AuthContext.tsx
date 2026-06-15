import { createContext, useState, useEffect, type ReactNode } from 'react';
import { z } from 'zod';
import { API_BASE_URL } from '../lib/apiConfig';

const SESSION_HINT_KEY = 'nexopay_session';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.email(),
  first_name: z.string(),
  last_name: z.string(),
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
}

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
      if ((window as any).google?.accounts?.id) {
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
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.disableAutoSelect();
    }
  }

  return (
    <AuthContext.Provider value={{ user, status, login, logout, googleReady, googleClientId }}>
      {children}
    </AuthContext.Provider>
  );
}

