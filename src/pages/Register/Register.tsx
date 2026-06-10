import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { registerUser } from '../../api-calls/auth/auth.post';

const registerSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.email('Ingresá un email válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
});

type FormStatus = 'idle' | 'loading' | 'error';
type FieldErrors = Partial<Record<'full_name' | 'email' | 'password' | 'confirm_password', string>>;

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setFieldErrors({});
    setServerError('');

    const result = registerSchema.safeParse({
      full_name: fullName,
      email,
      password,
      confirm_password: confirmPassword,
    });

    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (
          field === 'full_name' ||
          field === 'email' ||
          field === 'password' ||
          field === 'confirm_password'
        ) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setStatus('loading');
    try {
      const { token, user } = await registerUser({
        full_name: fullName,
        email,
        password,
      });
      login(token, user);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setStatus('error');
      setServerError(error instanceof Error ? error.message : 'Error al registrarse');
    }
  }

  return (
    <main>
      <h1>Crear cuenta</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="full_name">Nombre completo</label>
          <input
            id="full_name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            aria-describedby={fieldErrors.full_name ? 'full-name-error' : undefined}
            autoComplete="name"
          />
          {fieldErrors.full_name && (
            <span id="full-name-error" role="alert">{fieldErrors.full_name}</span>
          )}
        </div>

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
            autoComplete="new-password"
          />
          {fieldErrors.password && (
            <span id="password-error" role="alert">{fieldErrors.password}</span>
          )}
        </div>

        <div>
          <label htmlFor="confirm_password">Confirmá tu contraseña</label>
          <input
            id="confirm_password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-describedby={fieldErrors.confirm_password ? 'confirm-password-error' : undefined}
            autoComplete="new-password"
          />
          {fieldErrors.confirm_password && (
            <span id="confirm-password-error" role="alert">{fieldErrors.confirm_password}</span>
          )}
        </div>

        {status === 'error' && (
          <div aria-live="polite" role="alert">
            {serverError}
          </div>
        )}

        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      <p>
        ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
      </p>
    </main>
  );
}
