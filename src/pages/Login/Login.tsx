import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { loginUser } from '../../api-calls/auth/auth.post';

const loginSchema = z.object({
  email: z.email('Ingresá un email válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type FormStatus = 'idle' | 'loading' | 'error';
type FieldErrors = Partial<Record<'email' | 'password', string>>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setFieldErrors({});
    setServerError('');

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (field === 'email' || field === 'password') {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setStatus('loading');
    try {
      const { token, user } = await loginUser({ email, password });
      login(token, user);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setStatus('error');
      setServerError(error instanceof Error ? error.message : 'Error al iniciar sesión');
    }
  }

  return (
    <main>
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            autoComplete="email"
          />
          {fieldErrors.email && (
            <span id="email-error" role="alert">{fieldErrors.email}</span>
          )}
        </div>

        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            autoComplete="current-password"
          />
          {fieldErrors.password && (
            <span id="password-error" role="alert">{fieldErrors.password}</span>
          )}
        </div>

        {status === 'error' && (
          <div aria-live="polite" role="alert">
            {serverError}
          </div>
        )}

        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <p>
        ¿No tenés cuenta? <Link to="/register">Registrate</Link>
      </p>
    </main>
  );
}
