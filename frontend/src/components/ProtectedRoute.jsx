import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

// Blocks pages for logged-out users, and optionally for the wrong role
export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted center" style={{ marginTop: 40 }}>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
}