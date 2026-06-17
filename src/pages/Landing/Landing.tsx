import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { loginUser, registerUser, loginOrRegisterWithGoogle } from '../../api-calls/auth/auth.post';
import FloatingSymbols from '../../components/ui/FloatingSymbols';
import './Landing.css';

export default function Landing() {
  const { login, status, googleReady, googleClientId, user } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'loading'>('idle');
  const [alert, setAlert] = useState<{ message: string; type: 'error' | 'success' | 'info' | 'warning' } | null>(null);

  /* Redirige si ya está autenticado */
  useEffect(() => {
    if (status === 'authenticated' || user) {
      navigate('/dashboard', { replace: true });
    }
  }, [status, user, navigate]);

  /* Inicializa Google Identity (solo renderiza el botón nativo en el ref) */
  useEffect(() => {
    if (!googleReady || !googleClientId) return;

    // Extra runtime guard: ensure the SDK methods actually exist
    if (
      typeof window.google?.accounts?.id?.initialize !== 'function' ||
      typeof window.google?.accounts?.id?.renderButton !== 'function'
    ) {
      console.warn(
        '[Nexopay] Google GSI SDK flagged as ready but methods are missing. ' +
        'Will retry on next googleReady change.',
      );
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        // ⚠️  use_fedcm is intentionally OMITTED:
        //   FedCM is experimental and silently blocks the auth flow in many
        //   environments (localhost, some browsers, strict COOP headers).
        //   Letting GSI decide the best flow avoids invisible failures.
        auto_select: false,
        cancel_on_tap_outside: true,
        callback: async (response) => {
          console.log('[Nexopay] Google credential received, processing...');
          setFormStatus('loading');
          setAlert(null);
          try {
            const loggedUser = await loginOrRegisterWithGoogle(response.credential);
            login(loggedUser);
            navigate('/dashboard', { replace: true });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al iniciar sesión con Google';
            console.error('[Nexopay] Google login error:', err);
            setAlert({ message: msg, type: 'error' });
          } finally {
            setFormStatus('idle');
          }
        },
      });

      /* Renderiza el botón oficial de Google en el contenedor ref */
      const container = googleButtonRef.current;
      if (container) {
        container.innerHTML = '';
        window.google.accounts.id.renderButton(container, {
          theme: 'filled_black',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          width: 340,
          locale: 'es',
        });
        console.log('[Nexopay] Google Sign-In button rendered successfully.');
      } else {
        console.warn('[Nexopay] googleButtonRef.current is null — button container not mounted yet.');
      }
    } catch (err) {
      console.error('[Nexopay] Google Sign-In init error:', err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- login and navigate are stable refs; activeTab triggers re-render of the button container
  }, [googleReady, googleClientId, activeTab]);


  /* Botón de respaldo cuando Google SDK no está listo */
  const handleGoogleFallback = () => {
    if (!googleClientId || !window.google?.accounts?.id) {
      setAlert({ message: 'Google login no está disponible en este momento.', type: 'warning' });
      return;
    }
    window.google.accounts.id.prompt();
  };

  /* Inicio de sesión demo con credenciales de seed y fallback a mock */
  const handleDemoLogin = async () => {
    setAlert(null);
    setFormStatus('loading');
    try {
      // Intenta iniciar sesión real con el usuario de demo sembrado
      const loggedUser = await loginUser({ email: 'richard@nexopay.com', password: 'Test1234' });
      login(loggedUser);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      console.warn('Real demo login failed, falling back to mock login:', err);
      // Fallback local en caso de que el backend no responda o no esté sembrado
      const mockUser = {
        id: 'd8cae933-c80b-4a51-991d-795bcf54eb6d',
        email: 'richard@nexopay.com',
        first_name: 'Richard',
        last_name: 'González',
      };
      login(mockUser);
      setAlert({ message: 'Modo demo activado (local/offline). Redirigiendo...', type: 'info' });
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1200);
    } finally {
      setFormStatus('idle');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!email || !password) {
      setAlert({ message: 'Por favor, completa todos los campos.', type: 'warning' });
      return;
    }
    if (activeTab === 'register' && (!firstName || !lastName)) {
      setAlert({ message: 'Introduce tu nombre y apellido.', type: 'warning' });
      return;
    }
    if (activeTab === 'register' && password.length < 8) {
      setAlert({ message: 'La contraseña debe tener mínimo 8 caracteres.', type: 'warning' });
      return;
    }

    setFormStatus('loading');
    try {
      if (activeTab === 'login') {
        const loggedUser = await loginUser({ email, password });
        login(loggedUser);
        navigate('/dashboard', { replace: true });
      } else {
        await registerUser({ email, password, first_name: firstName, last_name: lastName });
        setAlert({ message: '¡Cuenta creada! Ahora puedes iniciar sesión.', type: 'success' });
        setActiveTab('login');
        setPassword('');
        setFirstName('');
        setLastName('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ocurrió un error en el servidor';
      setAlert({ message: msg, type: 'error' });
    } finally {
      setFormStatus('idle');
    }
  };

  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setAlert(null);
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
  };

  return (
    <div className="landing-container">
      <FloatingSymbols />

      {/* ── Orbes humeantes de fondo ── */}
      <div className="smoky-orb orb-gold" />
      <div className="smoky-orb orb-purple" />
      <div className="smoky-orb orb-green" />

      <div className="landing-grid">

        {/* ══════════ PANEL IZQUIERDO — HERO ══════════ */}
        <div className="landing-hero">
          {/* Orbes internos */}
          <div className="hero-orb-gold" />
          <div className="hero-orb-purple" />

          {/* Chart decorativo SVG */}
          <svg style={{ position: 'absolute', top: 40, left: 0, right: 0, opacity: 0.12 }} viewBox="0 0 700 260" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="0,200 100,170 200,185 310,130 430,145 540,80 700,95" stroke="#f3ba2f" strokeWidth="3" fill="none" strokeLinejoin="round" />
            <polyline points="0,230 100,210 200,220 310,180 430,195 540,140 700,155" stroke="#7c6dfa" strokeWidth="2" fill="none" strokeLinejoin="round" strokeDasharray="6 4" />
            {[100, 310, 540].map((x, i) => (
              <circle key={i} cx={x} cy={[170, 130, 80][i]} r="6" fill="#f3ba2f" opacity="0.9" />
            ))}
          </svg>

          {/* Texto hero */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#f3ba2f', marginBottom: 14 }}>
              Mesa de Dinero Digital Premium
            </div>

            <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 'clamp(44px,6vw,80px)', lineHeight: 0.92, letterSpacing: '-0.02em', marginBottom: 20 }}>
              <span style={{
                background: 'linear-gradient(135deg, #f3ba2f 0%, #fff8e1 40%, #f3ba2f 70%, #dca018 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 24px rgba(243,186,47,0.45))',
                display: 'block',
              }}>
                NEXOPAY
              </span>
            </div>

            <p style={{ maxWidth: 480, color: '#c5cdd8', fontSize: 15, lineHeight: 1.65, marginBottom: 8 }}>
              <strong style={{ color: '#fff' }}>Únete a la familia Nexopay.</strong>{' '}
              Gestiona capital global, divisas y activos digitales en un ecosistema diseñado para
              la libertad financiera y el desarrollo colectivo del continente.
            </p>
            <p style={{ color: '#8a99ad', fontSize: 13, lineHeight: 1.6, marginBottom: 32 }}>
              Tecnología de máxima seguridad conectada con las mesas de cambio más competitivas del mercado.
            </p>

            {/* Métricas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, maxWidth: 480 }}>
              {[
                { value: '3 Activas', label: 'ARS · USD · EUR', color: '#f3ba2f' },
                { value: 'Google', label: 'Autenticación segura', color: '#7c6dfa' },
                { value: '100%', label: 'Inclusivo y premium', color: '#00e676' },
              ].map((m) => (
                <div key={m.value} style={{
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12,
                  backdropFilter: 'blur(8px)',
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: m.color, fontFamily: "'Orbitron',sans-serif" }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: '#8a99ad', marginTop: 4 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════ PANEL DERECHO — CARD AUTH ══════════ */}
        <div className="landing-card">
          <div className="card-orb" />

          <div style={{ padding: '32px 30px', position: 'relative', zIndex: 1 }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#f3ba2f', marginBottom: 8 }}>
                Portal de Acceso
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                {activeTab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </h2>
              <p style={{ fontSize: 12, color: '#8a99ad', lineHeight: 1.5 }}>
                {activeTab === 'login'
                  ? 'Ingresa tus credenciales o continúa con Google.'
                  : 'Completa tus datos para unirte a la familia Nexopay.'}
              </p>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
              {(['login', 'register'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => switchTab(tab)}
                  className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                >
                  {tab === 'login' ? 'Ingresar' : 'Registrarse'}
                </button>
              ))}
            </div>

            {/* Alert */}
            {alert && (
              <div className={`toast toast-${alert.type}`} style={{ pointerEvents: 'auto', animation: 'none', width: '100%', position: 'relative', right: 'auto', bottom: 'auto', marginBottom: 18 }}>
                <div className="toast-content">
                  <span className="toast-title" style={{ fontSize: '10px' }}>
                    {alert.type === 'error' ? 'Error' : alert.type === 'success' ? 'Éxito' : alert.type === 'warning' ? 'Advertencia' : 'Info'}
                  </span>
                  <span className="toast-message" style={{ fontSize: '12px' }}>{alert.message}</span>
                </div>
                <button type="button" className="toast-close" onClick={() => setAlert(null)} aria-label="Cerrar">&times;</button>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeTab === 'register' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label htmlFor="firstname-input">Nombre</label>
                    <input id="firstname-input" type="text" placeholder="Ej. Richard" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="neon-input" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastname-input">Apellido</label>
                    <input id="lastname-input" type="text" placeholder="Ej. González" value={lastName} onChange={(e) => setLastName(e.target.value)} className="neon-input" required />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email-input">Correo Electrónico</label>
                <input id="email-input" type="email" placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="neon-input" required autoComplete="email" />
              </div>

              <div className="form-group">
                <label htmlFor="password-input">Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="neon-input"
                    required
                    autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#8a99ad', fontSize: 15, padding: 0, lineHeight: 1,
                      zIndex: 2,
                    }}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={formStatus === 'loading'}
                className="submit-btn"
              >
                {formStatus === 'loading' ? (
                  <>
                    <span className="loading-spinner" />
                    Procesando...
                  </>
                ) : activeTab === 'login' ? 'Ingresar a mi cuenta' : 'Registrarme en Nexopay'}
              </button>

              {activeTab === 'login' && (
                <button
                  type="button"
                  className="demo-btn"
                  onClick={handleDemoLogin}
                  disabled={formStatus === 'loading'}
                >
                  {formStatus === 'loading' ? (
                    <span className="loading-spinner" style={{ borderColor: 'rgba(0, 230, 118, 0.2)', borderTopColor: '#00e676' }} />
                  ) : (
                    'Acceso Rápido a Demo'
                  )}
                </button>
              )}
            </form>

            {/* Divisor */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06))' }} />
              <span style={{ margin: '0 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a5568' }}>O continuar con</span>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(255,255,255,0.06),transparent)' }} />
            </div>

            {/* ── Botón Google — UN SOLO BOTÓN ── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              {googleReady && googleClientId ? (
                /* Botón oficial del SDK de Google (theme filled_black = oscuro) */
                <div ref={googleButtonRef} style={{ width: '100%', display: 'flex', justifyContent: 'center', minHeight: 44 }} />
              ) : (
                /* Fallback: botón custom cuando el SDK aún no cargó o no hay Client ID */
                <button
                  type="button"
                  onClick={handleGoogleFallback}
                  style={{
                    width: '100%', minHeight: 44, borderRadius: 10, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#e8eaf0', fontWeight: 700, fontSize: 13,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  Continuar con Google
                </button>
              )}
            </div>

            {/* Link cambio de tab */}
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <span style={{ fontSize: 12, color: '#8a99ad' }}>
                {activeTab === 'login' ? '¿Aún no tienes cuenta? ' : '¿Ya eres parte de la familia? '}
              </span>
              <button
                type="button"
                onClick={() => switchTab(activeTab === 'login' ? 'register' : 'login')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#f3ba2f', fontWeight: 700, fontSize: 12,
                  textDecoration: 'underline', padding: 0,
                }}
              >
                {activeTab === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
