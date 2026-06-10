import { createContext, useState, useEffect, type ReactNode } from 'react';
import { z } from 'zod';

export const TOKEN_KEY = 'nexopay_token';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.email(),
  full_name: z.string(),
});

export type User = z.infer<typeof userSchema>;

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const storedToken = sessionStorage.getItem(TOKEN_KEY);

    if (!storedToken) {
      setStatus('unauthenticated');
      return;
    }

    const controller = new AbortController();

    async function checkSession(): Promise<void> {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          sessionStorage.removeItem(TOKEN_KEY);
          setStatus('unauthenticated');
          return;
        }

        const raw: unknown = await response.json();
        const parsed = userSchema.safeParse(raw);

        if (parsed.success) {
          setToken(storedToken);
          setUser(parsed.data);
          setStatus('authenticated');
        } else {
          sessionStorage.removeItem(TOKEN_KEY);
          setStatus('unauthenticated');
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          sessionStorage.removeItem(TOKEN_KEY);
          setStatus('unauthenticated');
        }
      }
    }

    void checkSession();
    return () => controller.abort();
  }, []);

  function login(newToken: string, newUser: User): void {
    sessionStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
    setStatus('authenticated');
  }

  function logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }

  return (
    <AuthContext.Provider value={{ user, token, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
