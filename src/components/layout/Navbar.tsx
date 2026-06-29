import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { logoutUser } from '../../api-calls/auth/auth.post';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState('');

  const handleLogout = async () => {
    setLogoutError('');
    try {
      await logoutUser();
      logout();
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setLogoutError('Error al cerrar sesión.');
      console.error(err);
    }
  };

  const getInitials = () => {
    if (!user) return 'N';
    return `${user.first_name[0] || ''}${user.last_name ? user.last_name[0] || '' : ''}`.toUpperCase();
  };

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="brand smoky-text">NEXO PAY</div>
        <div className="small badge">Mercados · Divisas</div>
      </div>
      <div className="nav-actions">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isAdmin && (
              <button 
                className="btn btn-outline" 
                onClick={() => navigate('/admin')} 
                style={{ padding: '6px 12px', fontSize: '12px', borderColor: '#39ff14', color: '#39ff14' }}
              >
                Panel Admin
              </button>
            )}
            <div className="avatar" style={{ width: 32, height: 32, fontSize: '12px' }}>
              {getInitials()}
            </div>
            <span className="small">Hola, {user.first_name}</span>
            <button className="btn btn-ghost" onClick={handleLogout} style={{ padding: '6px 10px', fontSize: '12px', minHeight: 'auto' }}>
              Salir
            </button>
            {logoutError && <span className="small" style={{ color: 'var(--accent-danger)' }}>{logoutError}</span>}
          </div>
        ) : (
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Ingresar
          </button>
        )}
      </div>
    </header>
  );
}
