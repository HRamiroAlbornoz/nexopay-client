import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/common/Spinner';

export const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-cyber-black">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the original destination location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export const AdminRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-cyber-black">
        <Spinner />
      </div>
    );
  }

  if (!user || !profile || profile.role !== 'admin') {
    // If not admin, redirect to home page
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
