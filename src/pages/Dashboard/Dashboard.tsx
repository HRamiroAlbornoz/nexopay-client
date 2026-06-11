import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { logoutUser } from '../../api-calls/auth/auth.post';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState('');

  async function handleLogout(): Promise<void> {
    setLogoutError('');
    try {
      await logoutUser();
      logout();
      navigate('/login', { replace: true });
    } catch {
      setLogoutError('No se pudo cerrar sesión. Intentá de nuevo.');
    }
  }

  return (
    <main>
      <h1>Bienvenido, {user?.first_name} {user?.last_name}</h1>
      {logoutError && <p role="alert">{logoutError}</p>}
      <button type="button" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </main>
  );
}
