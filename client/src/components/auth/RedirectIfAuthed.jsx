import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "../../store/auth/authContext";

// Inverse of ProtectedRoute: bounce already-authenticated users away from
// auth-flow pages (/signin, /signup, /forgot-password, /reset-password).
// If they were redirected here from a protected page, send them back; else
// drop them on /dashboard.
export function RedirectIfAuthed({ children, fallback = "/dashboard" }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (user) {
    const to = location.state?.from?.pathname || fallback;
    return <Navigate to={to} replace />;
  }

  return children;
}
