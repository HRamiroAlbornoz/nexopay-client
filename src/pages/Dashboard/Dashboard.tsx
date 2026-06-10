import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { logoutUser } from '../../api-calls/auth/auth.post';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout(): Promise<void> {
    try {
      await logoutUser();
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  }

  return (
    <main>
      <h1>Bienvenido, {user?.first_name}</h1>
      <button type="button" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </main>
  );
}
