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
  { label: 'Traslados', path: '/traslados' },
  { label: 'Licencias', path: '/licencias-office' },
  { label: 'Observaciones', path: '/observaciones' },
  { label: 'Reportes', path: '/reportes' },
  { label: 'Copias de seguridad', path: '/respaldos' },
];

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Panel lateral en Negro institucional (#1A1A1A) — norma del acta
          de colores para el "panel lateral de navegación". */}
      <aside className="w-56 shrink-0 bg-ink">
        <div className="border-b border-white/10 px-4 py-4 font-display text-sm font-bold text-white">
          SPY <span className="text-sena">·</span> Inventario SENA
        </div>
        <nav className="p-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-sena font-medium text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end gap-4 border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          {/* Campo confirmado contra UserResource.php: 'nombre', no 'name' */}
          <span className="text-sm text-slate-600">{user?.nombre}</span>
          <button onClick={logout} className="text-sm text-danger hover:underline">
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
