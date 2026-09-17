import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';

// Cada fase agrega su entrada aquí cuando el módulo queda listo
// (Fase 1: Sedes; después Subsedes, Ubicaciones, Equipos...).
const NAV_ITEMS = [
  { label: 'Sedes', path: '/sedes' },
  { label: 'Subsedes', path: '/subsedes' },
  { label: 'Ubicaciones', path: '/ubicaciones-formacion' },
  { label: 'Tipos de Equipo', path: '/tipos-equipo' },
  { label: 'Responsables', path: '/responsables' },
  { label: 'Equipos', path: '/equipos' },
  { label: 'Mantenimientos', path: '/mantenimientos' },
  { label: 'Licencias', path: '/licencias-office' },
  { label: 'Observaciones', path: '/observaciones' },
  { label: 'Reportes', path: '/reportes' },
];

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-56 shrink-0 border-r bg-white">
        <div className="border-b px-4 py-4 font-semibold text-slate-800">SPY — Inventario SENA</div>
        <nav className="p-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm ${
                  isActive ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end gap-4 border-b bg-white px-6 py-4 shadow-sm">
          {/* Campo confirmado contra UserResource.php: 'nombre', no 'name' */}
          <span className="text-sm text-slate-600">{user?.nombre}</span>
          <button onClick={logout} className="text-sm text-red-600 hover:underline">
            Cerrar sesión
          </button>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}