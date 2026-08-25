import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleHomes = { farmer: "/farmer", buyer: "/buyer", admin: "/admin" };

export default function RequireRole({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  const currentRole = user.role?.toLowerCase();
  if (currentRole !== role) {
    return <Navigate to={roleHomes[currentRole] || "/login"} replace />;
  }

  return children;
}
