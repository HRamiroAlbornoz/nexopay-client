import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};
