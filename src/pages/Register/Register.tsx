import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { registerUser } from '../../api-calls/auth/auth.post';
import { mapZodIssuesToFieldErrors } from '../../lib/form-utils';

const registerSchema = z.object({
  first_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  last_name: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.email('Ingresá un email válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
});

const REGISTER_FIELDS = ['first_name', 'last_name', 'email', 'password', 'confirm_password'] as const;
type FieldErrors = Partial<Record<typeof REGISTER_FIELDS[number], string>>;
type FormStatus = 'idle' | 'loading';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      confirm_password: confirmPassword,
    });

    if (!result.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues, REGISTER_FIELDS));
      return;
    }

    setStatus('loading');
    try {
      const user = await registerUser({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });
      login(user);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Error al registrarse');
    } finally {
      setStatus('idle');
    }
  }

  return (
    <main>
      <h1>Crear cuenta</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="first_name">Nombre</label>
          <input
            id="first_name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            aria-describedby={fieldErrors.first_name ? 'first-name-error' : undefined}
            autoComplete="given-name"
          />
          {fieldErrors.first_name && (
            <span id="first-name-error" role="alert">{fieldErrors.first_name}</span>
          )}
        </div>

        <div>
          <label htmlFor="last_name">Apellido</label>
          <input
            id="last_name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            aria-describedby={fieldErrors.last_name ? 'last-name-error' : undefined}
            autoComplete="family-name"
          />
          {fieldErrors.last_name && (
            <span id="last-name-error" role="alert">{fieldErrors.last_name}</span>
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

        {serverError && (
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
