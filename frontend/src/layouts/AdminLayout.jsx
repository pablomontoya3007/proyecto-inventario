import { Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
        <span className="font-semibold text-slate-800">SPY — Inventario SENA</span>

        <div className="flex items-center gap-4">
          {/* Campo confirmado contra UserResource.php: 'nombre', no 'name' */}
          <span className="text-sm text-slate-600">{user?.nombre}</span>
          <button onClick={logout} className="text-sm text-red-600 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
