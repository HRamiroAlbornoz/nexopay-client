import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Shield, Sparkles, Terminal, Mail, Lock } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginWithEmail, loginWithGoogle, error, clearError, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state or default to Home
  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    // Clear errors when mounting
    clearError();
    setLocalError(null);
  }, []);

  useEffect(() => {
    // If user gets authenticated, redirect them
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password) {
      setLocalError('Por favor completa todos los campos.');
      return;
    }
    setLocalError(null);
    setIsSubmitting(true);

    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      // Error is set in AuthContext and displayed
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-[90vh] flex flex-col justify-center items-center px-4 py-12 bg-cyber-black cyber-grid">
      {/* Visual background lights */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyber-cyan/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyber-pink/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Login Box */}
      <div className="w-full max-w-md bg-cyber-card border-2 border-cyber-gray p-8 relative shadow-2xl">
        {/* Street Accent Tag */}
        <div className="absolute -top-3.5 left-6 bg-cyber-cyan text-cyber-black px-3 py-0.5 font-display text-[10px] font-black uppercase tracking-widest">
          ACCESS_POINT // VOL.05
        </div>

        {/* Cyber Aesthetic Corners */}
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-pink"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber-pink"></div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display font-black text-3xl tracking-tight text-white mb-2 uppercase">
            INICIAR <span className="text-cyber-cyan neon-text-cyan">SESIÓN</span>
          </h1>
          <p className="text-xs text-cyber-light/60 uppercase tracking-widest">
            Ingresa a la red de streetwear y tecnología neón
          </p>
        </div>

        {/* Error Alerts */}
        {(localError || error) && (
          <div className="mb-6 bg-cyber-pink/10 border-l-4 border-cyber-pink p-3 text-xs text-cyber-pink font-mono uppercase">
            <span className="font-bold">❌ ERROR:</span> {localError || error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-widest text-cyber-light/70 font-mono mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-cyber-cyan">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cyber@neontech.com"
                className="w-full pl-10 pr-4 py-2.5 bg-cyber-black border-2 border-cyber-gray focus:border-cyber-cyan focus:shadow-neon-cyan text-white text-sm outline-none transition-all duration-300 font-mono rounded-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-cyber-light/70 font-mono mb-2">
              Usuario
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-cyber-cyan">
                <Shield className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="cyber-rider"
                className="w-full pl-10 pr-4 py-2.5 bg-cyber-black border-2 border-cyber-gray focus:border-cyber-cyan focus:shadow-neon-cyan text-white text-sm outline-none transition-all duration-300 font-mono rounded-none"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs uppercase tracking-widest text-cyber-light/70 font-mono">
                Contraseña
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-cyber-cyan">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-cyber-black border-2 border-cyber-gray focus:border-cyber-cyan focus:shadow-neon-cyan text-white text-sm outline-none transition-all duration-300 font-mono rounded-none"
              />
            </div>
          </div>

          {/* Regular Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-neon-cyan py-3 mt-4"
          >
            {isSubmitting ? 'CONECTANDO...' : 'INGRESAR AL SISTEMA'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8 flex items-center justify-center">
          <div className="w-full border-t border-cyber-gray"></div>
          <span className="absolute bg-cyber-card px-3 text-[10px] font-mono uppercase tracking-widest text-cyber-light/40">
            CONEXIÓN ALTERNATIVA
          </span>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 border-2 border-cyber-gray hover:border-cyber-pink hover:text-cyber-pink hover:shadow-neon-pink bg-cyber-black text-white text-xs font-mono uppercase tracking-widest py-3 transition-all duration-300 rounded-none cursor-pointer"
        >
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.111 4.114-3.416 0-6.19-2.77-6.19-6.19 0-3.42 2.774-6.19 6.19-6.19 1.573 0 2.977.587 4.07 1.545l3.1-3.1C19.23 2.222 15.938 1 12.24 1 5.866 1 .7 6.166.7 12.532C.7 18.898 5.866 24.1 12.24 24.1c6.262 0 11.534-4.5 11.534-11.534 0-.756-.067-1.464-.19-2.28H12.24z" />
          </svg>
          Iniciar sesión con Google
        </button>

        {/* Signup Link */}
        <div className="mt-8 text-center text-xs">
          <span className="text-cyber-light/60 uppercase">¿No tienes una cuenta? </span>
          <Link
            to="/register"
            className="text-cyber-pink neon-text-pink hover:underline uppercase tracking-wider font-bold"
          >
            Regístrate aquí
          </Link>
        </div>
      </div>

    </div>
  );
};

export default Login;
