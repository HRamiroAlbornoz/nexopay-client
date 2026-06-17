import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { z } from 'zod';
import { API_BASE_URL } from '../lib/apiConfig';

const SESSION_HINT_KEY = 'nexopay_session';

// eslint-disable-next-line react-refresh/only-export-components -- Zod schema is exported for reuse in other modules; not a React component
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

// eslint-disable-next-line react-refresh/only-export-components -- Context and Provider are intentionally co-located; Vite HMR limitation
export const AuthContext = createContext<AuthContextValue | null>(null);

/** Validates that the Google GSI SDK is fully operational */
function isGoogleReady(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.google !== 'undefined' &&
    typeof window.google?.accounts?.id?.initialize === 'function' &&
    typeof window.google?.accounts?.id?.renderButton === 'function'
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [googleReady, setGoogleReady] = useState(false);

  // Read once at mount — VITE_GOOGLE_CLIENT_ID is now typed in vite-env.d.ts
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || undefined;

  // ── Load Google Identity Services script ────────────────────────────────────
  useEffect(() => {
    if (!googleClientId) {
      // No Client ID configured — skip silently (no alert spam)
      return;
    }

    // Already loaded and operational
    if (isGoogleReady()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- guard-clause: sets state once synchronously and returns; mirrors session-check pattern
      setGoogleReady(true);
      return;
    }

    const GSI_SRC = 'https://accounts.google.com/gsi/client';

    // Script already injected but may not have fired onload yet
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      // Poll until operational (handles cases where onload already fired)
      const poll = setInterval(() => {
        if (isGoogleReady()) {
          clearInterval(poll);
          setGoogleReady(true);
        }
      }, 100);
      // Stop polling after 10 s to avoid memory leaks
      const timeout = setTimeout(() => clearInterval(poll), 10_000);
      return () => {
        clearInterval(poll);
        clearTimeout(timeout);
      };
    }

    // Inject fresh script
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // The SDK may need a microtask to fully initialize after onload
      const poll = setInterval(() => {
        if (isGoogleReady()) {
          clearInterval(poll);
          setGoogleReady(true);
        }
      }, 50);
      // Abort after 8 s
      setTimeout(() => clearInterval(poll), 8_000);
    };

    script.onerror = () => {
      console.error(
        '[Nexopay] Google GSI script failed to load. ' +
        'Check network connectivity and Content Security Policy headers.',
      );
      // googleReady stays false → fallback button will render
    };

    document.head.appendChild(script);

    // No cleanup needed for the script itself (intentional singleton)
  }, [googleClientId]);

  // ── Session check on mount ──────────────────────────────────────────────────
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

  const login = useCallback((newUser: User): void => {
    localStorage.setItem(SESSION_HINT_KEY, '1');
    setUser(newUser);
    setStatus('authenticated');
  }, []);

  const logout = useCallback((): void => {
    localStorage.removeItem(SESSION_HINT_KEY);
    setUser(null);
    setStatus('unauthenticated');
    try {
      if (isGoogleReady()) {
        window.google?.accounts?.id?.disableAutoSelect();
      }
    } catch {
      // Swallow GSI errors during logout — non-critical
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, logout, googleReady, googleClientId }}>
      {children}
    </AuthContext.Provider>
  );
}
