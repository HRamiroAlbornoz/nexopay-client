import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { loginUser, registerUser, loginOrRegisterWithGoogle } from '../../api-calls/auth/auth.post';
import FloatingSymbols from '../../components/ui/FloatingSymbols';

export default function Landing() {
  const { login, status, googleReady, googleClientId, user } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [formStatus, setFormStatus] = useState<'idle' | 'loading'>('idle');
  const [alert, setAlert] = useState<{ message: string; type: 'error' | 'success' | 'info' | 'warning' } | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (status === 'authenticated' || user) {
      navigate('/dashboard', { replace: true });
    }
  }, [status, user, navigate]);

  // Google One Tap & button rendering
  useEffect(() => {
    if (!googleReady || !googleClientId || !(window as any).google?.accounts?.id) return;

    try {
      (window as any).google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: any) => {
          setFormStatus('loading');
          setAlert(null);
          try {
            const loggedUser = await loginOrRegisterWithGoogle(response.credential);
            login(loggedUser);
            navigate('/dashboard', { replace: true });
          } catch (err: any) {
            setAlert({ message: err.message || 'Error al iniciar sesión con Google', type: 'error' });
          } finally {
            setFormStatus('idle');
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm: true,
      });

      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = '';
        (window as any).google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          width: 320,
          locale: 'es',
        });
      }
    } catch (error) {
      console.error('Error initializing Google Sign-In:', error);
    }
  }, [googleReady, googleClientId, activeTab, login, navigate]);

  const handleGooglePrompt = () => {
    if (!googleClientId || !(window as any).google?.accounts?.id) {
      setAlert({
        message: 'Google login no está configurado en el archivo .env (VITE_GOOGLE_CLIENT_ID).',
        type: 'warning',
      });
      return;
    }
    (window as any).google.accounts.id.prompt();
  };

  const handleDemoLogin = import.meta.env.DEV
    ? () => {
        setAlert(null);
        // Demo user payload matching the active database seed user
        const demoUser = {
          id: 'd8cae933-c80b-4a51-991d-795bcf54eb6d', // Will fallback to backend check
          email: 'richard@nexopay.com',
          first_name: 'Richard',
          last_name: 'González',
        };
        login(demoUser);
        setAlert({ message: 'Accediendo en modo demo local. Usa credenciales de la base de datos para pruebas reales.', type: 'info' });
        navigate('/dashboard', { replace: true });
      }
    : undefined;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!email || !password) {
      setAlert({ message: 'Por favor, completa todos los campos.', type: 'warning' });
      return;
    }

    if (activeTab === 'register' && (!firstName || !lastName)) {
      setAlert({ message: 'Por favor, introduce tu nombre y apellido.', type: 'warning' });
      return;
    }

    if (activeTab === 'register' && password.length < 8) {
      setAlert({ message: 'La contraseña debe tener al menos 8 caracteres.', type: 'warning' });
      return;
    }

    setFormStatus('loading');
    try {
      if (activeTab === 'login') {
        const loggedUser = await loginUser({ email, password });
        login(loggedUser);
        navigate('/dashboard', { replace: true });
      } else {
        await registerUser({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        });
        setAlert({ message: '¡Cuenta creada correctamente! Ahora puedes iniciar sesión.', type: 'success' });
        setActiveTab('login');
        setPassword('');
        setFirstName('');
        setLastName('');
      }
    } catch (err: any) {
      setAlert({ message: err.message || 'Ocurrió un error en el servidor', type: 'error' });
    } finally {
      setFormStatus('idle');
    }
  };

  return (
    <div className="app-root soft-finance-bg">
      <FloatingSymbols />

      <section className="login-shell" style={{ zIndex: 1 }}>
        {/* Left Panel: Welcome Hero */}
        <div className="login-hero">
          <div className="eyebrow" style={{ color: 'var(--accent-primary)', fontWeight: '900' }}>
            Mesa de Dinero Digital Premium
          </div>
          <h1>NEXOPAY</h1>
          <p style={{ fontSize: '15px', color: '#c0c8db', lineHeight: '1.6', marginTop: '16px' }}>
            <strong>Únete a la familia Nexopay.</strong> Aquí no solo gestionas capital global, divisas y criptoactivos;
            también formas parte de un ecosistema diseñado para impulsar la inclusión, el desarrollo colectivo y
            la libertad financiera de las mentes más ambiciosas del continente.
          </p>
          <p style={{ fontSize: '13.5px', color: '#8a99ad', lineHeight: '1.6', marginTop: '8px' }}>
            Nuestra tecnología de máxima seguridad está creada para conectar tus operaciones
            con las mesas de cambio más competitivas, asegurando un trato de prestigio y exclusividad.
          </p>
          <div className="hero-metrics" style={{ marginTop: '24px' }}>
            <div>
              <span>3 Activas</span>
              <small>ARS, USD, EUR</small>
            </div>
            <div>
              <span>Google</span>
              <small>Autenticación segura</small>
            </div>
            <div>
              <span>100%</span>
              <small>Inclusivo y premium</small>
            </div>
          </div>
        </div>

        {/* Right Panel: Auth Card */}
        <div className="login-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div className="section-kicker">Portal de acceso</div>
            <h2>{activeTab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
            <p className="small">
              {activeTab === 'login'
                ? 'Ingresa tus credenciales registradas o continúa usando Google Identity.'
                : 'Completa tus datos para registrarte en la plataforma y ser parte de esta familia.'}
            </p>
          </div>

          {/* Form Selector Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--panel-border)', marginBottom: '8px' }}>
            <button
              className="menu-item-neon"
              type="button"
              style={{
                flex: 1,
                textAlign: 'center',
                borderBottom: activeTab === 'login' ? '2px solid var(--accent-primary)' : 'none',
                color: activeTab === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderRadius: '8px 8px 0 0',
                padding: '10px',
                background: 'transparent',
              }}
              onClick={() => {
                setActiveTab('login');
                setAlert(null);
                setEmail('');
                setPassword('');
              }}
            >
              Ingresar
            </button>
            <button
              className="menu-item-neon"
              type="button"
              style={{
                flex: 1,
                textAlign: 'center',
                borderBottom: activeTab === 'register' ? '2px solid var(--accent-primary)' : 'none',
                color: activeTab === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderRadius: '8px 8px 0 0',
                padding: '10px',
                background: 'transparent',
              }}
              onClick={() => {
                setActiveTab('register');
                setAlert(null);
                setEmail('');
                setPassword('');
                setFirstName('');
                setLastName('');
              }}
            >
              Registrarse
            </button>
          </div>

          {/* Alert Banner */}
          {alert && (
            <div
              className={`toast toast-${alert.type}`}
              style={{
                pointerEvents: 'auto',
                animation: 'none',
                width: '100%',
                position: 'relative',
                right: 'auto',
                bottom: 'auto',
                zIndex: 'auto',
              }}
            >
              <div className="toast-content">
                <span className="toast-title" style={{ fontSize: '10px' }}>
                  {alert.type === 'error'
                    ? 'Error'
                    : alert.type === 'success'
                    ? 'Éxito'
                    : alert.type === 'warning'
                    ? 'Advertencia'
                    : 'Información'}
                </span>
                <span className="toast-message" style={{ fontSize: '12px' }}>
                  {alert.message}
                </span>
              </div>
              <button
                type="button"
                className="toast-close"
                onClick={() => setAlert(null)}
                aria-label="Cerrar alerta"
              >
                &times;
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeTab === 'register' && (
              <>
                <div className="form-group">
                  <label htmlFor="firstname-input">Nombre</label>
                  <input
                    id="firstname-input"
                    type="text"
                    placeholder="Ej. Richard"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="neon-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastname-input">Apellido</label>
                  <input
                    id="lastname-input"
                    type="text"
                    placeholder="Ej. González"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="neon-input"
                    required
                  />
                </div>
              </>
            )}
            <div className="form-group">
              <label htmlFor="email-input">Correo Electrónico</label>
              <input
                id="email-input"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="neon-input"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password-input">Contraseña</label>
              <input
                id="password-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="neon-input"
                required
                autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            <button
              type="submit"
              disabled={formStatus === 'loading'}
              className="btn btn-primary wide"
              style={{ marginTop: '10px' }}
            >
              {formStatus === 'loading'
                ? 'Procesando...'
                : activeTab === 'login'
                ? 'Ingresar a mi cuenta'
                : 'Registrarme en Nexopay'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--panel-border)' }} />
            <span
              className="small"
              style={{
                margin: '0 10px',
                fontSize: '11px',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
              }}
            >
              O continuar con
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--panel-border)' }} />
          </div>

          {/* Social Sign In */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {googleReady && googleClientId && (
              <div
                style={{ display: 'flex', justifyContent: 'center' }}
                ref={googleButtonRef}
              />
            )}
            <button
              type="button"
              className="btn btn-ghost wide"
              onClick={handleGooglePrompt}
              style={{ gap: '10px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              Google Identity One-Tap
            </button>

            {import.meta.env.DEV && handleDemoLogin && (
              <button
                type="button"
                className="btn btn-ghost wide"
                onClick={handleDemoLogin}
                style={{ borderColor: 'rgba(0, 230, 118, 0.35)', color: '#00e676' }}
              >
                Acceso Demo Richard
              </button>
            )}

            {activeTab === 'login' ? (
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <span className="small" style={{ color: 'var(--text-secondary)' }}>
                  ¿Aún no tienes cuenta?{' '}
                </span>
                <button
                  type="button"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    padding: '0',
                    textDecoration: 'underline',
                  }}
                  onClick={() => {
                    setActiveTab('register');
                    setAlert(null);
                  }}
                >
                  Regístrate aquí
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <span className="small" style={{ color: 'var(--text-secondary)' }}>
                  ¿Ya eres parte de la familia?{' '}
                </span>
                <button
                  type="button"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    padding: '0',
                    textDecoration: 'underline',
                  }}
                  onClick={() => {
                    setActiveTab('login');
                    setAlert(null);
                  }}
                >
                  Inicia sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
