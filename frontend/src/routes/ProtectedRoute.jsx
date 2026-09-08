import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  // Mientras se valida el token contra /me, no se decide nada todavía:
  // mostrar el login de una vez causaría un parpadeo si el usuario sí
  // tenía sesión válida.
  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Cargando sesión...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
