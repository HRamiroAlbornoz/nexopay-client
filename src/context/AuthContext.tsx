import { createContext, useState, useEffect, type ReactNode } from 'react';
import { z } from 'zod';

export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
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

const meResponseSchema = z.object({ user: userSchema });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const controller = new AbortController();

    async function checkSession(): Promise<void> {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok) {
          setStatus('unauthenticated');
          return;
        }

        const raw: unknown = await response.json();
        const parsed = meResponseSchema.safeParse(raw);

        if (parsed.success) {
          setUser(parsed.data.user);
          setStatus('authenticated');
        } else {
          setStatus('unauthenticated');
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          setStatus('unauthenticated');
        }
      }
    }

    void checkSession();
    return () => controller.abort();
  }, []);

  function login(newUser: User): void {
    setUser(newUser);
    setStatus('authenticated');
  }

  function logout(): void {
    setUser(null);
    setStatus('unauthenticated');
  }

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
