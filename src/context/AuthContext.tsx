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
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    // Si no hay pista de sesión en localStorage, el usuario definitivamente no está logueado
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
  }

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
