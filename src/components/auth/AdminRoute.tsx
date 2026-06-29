import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function AdminRoute() {
  const { status, isAdmin } = useAuth();

  if (status === 'loading') {
    return (
      <div className="admin-loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f0c29', color: '#fff' }}>
        <p>Verificando permisos...</p>
      </div>
    );
  }

  if (status === 'unauthenticated' || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
