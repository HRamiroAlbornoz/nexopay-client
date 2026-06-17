import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Mail, Lock, User as UserIcon, Terminal } from 'lucide-react';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { registerWithEmail, error, clearError, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
    setLocalError(null);
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setLocalError('Por favor completa todos los campos.');
      return;
    }
    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLocalError(null);
    setIsSubmitting(true);

    try {
      await registerWithEmail(email, password, name);
    } catch (err: any) {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-[90vh] flex flex-col justify-center items-center px-4 py-12 bg-cyber-black cyber-grid">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyber-cyan/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyber-pink/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-cyber-card border-2 border-cyber-gray p-8 relative shadow-2xl">
        <div className="absolute -top-3.5 left-6 bg-cyber-pink text-cyber-black px-3 py-0.5 font-display text-[10px] font-black uppercase tracking-widest">
          SYS_REGISTER // VOL.05
        </div>

        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-cyan"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber-cyan"></div>

        <div className="text-center mb-8">
          <h1 className="font-display font-black text-3xl tracking-tight text-white mb-2 uppercase">
            CREAR <span className="text-cyber-pink neon-text-pink">CUENTA</span>
          </h1>
          <p className="text-xs text-cyber-light/60 uppercase tracking-widest">
            Regístrate y conéctate al sistema Neon Tech
          </p>
        </div>

        {(localError || error) && (
          <div className="mb-6 bg-cyber-pink/10 border-l-4 border-cyber-pink p-3 text-xs text-cyber-pink font-mono uppercase">
            <span className="font-bold">❌ ERROR:</span> {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-widest text-cyber-light/70 font-mono mb-2">
              Nombre Completo
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-cyber-pink">
                <UserIcon className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cyber Rider"
                className="w-full pl-10 pr-4 py-2.5 bg-cyber-black border-2 border-cyber-gray focus:border-cyber-pink focus:shadow-neon-pink text-white text-sm outline-none transition-all duration-300 font-mono rounded-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-cyber-light/70 font-mono mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-cyber-pink">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rider@neontech.com"
                className="w-full pl-10 pr-4 py-2.5 bg-cyber-black border-2 border-cyber-gray focus:border-cyber-pink focus:shadow-neon-pink text-white text-sm outline-none transition-all duration-300 font-mono rounded-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-cyber-light/70 font-mono mb-2">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-cyber-pink">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-4 py-2.5 bg-cyber-black border-2 border-cyber-gray focus:border-cyber-pink focus:shadow-neon-pink text-white text-sm outline-none transition-all duration-300 font-mono rounded-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-neon-pink py-3 mt-4"
          >
            {isSubmitting ? 'CREANDO RED...' : 'REGISTRARSE EN NEON TECH'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs">
          <span className="text-cyber-light/60 uppercase">¿Ya tienes cuenta? </span>
          <Link
            to="/login"
            className="text-cyber-cyan neon-text-cyan hover:underline uppercase tracking-wider font-bold"
          >
            Inicia sesión aquí
          </Link>
        </div>
      </div>

    </div>
  );
};

export default Register;
