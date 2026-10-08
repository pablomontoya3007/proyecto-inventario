import { Outlet, NavLink } from 'react-router-dom';
import {
  ArrowLeftRight,
  Building,
  Building2,
  ChartColumn,
  CircleUser,
  DatabaseBackup,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  MessageSquareText,
  Monitor,
  ShieldCheck,
  Tags,
  TriangleAlert,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useLicenciasSinActualizar } from '../features/licencias/hooks/useLicencias';

// Se calcula al cargar la app: el año del pie se actualiza solo.
const ANIO_ACTUAL = new Date().getFullYear();

/**
 * Menú agrupado por secciones para que los módulos sean fáciles de
 * encontrar. Cada entrada lleva su ícono de lucide-react (solo los
 * íconos importados aquí entran al build, no la librería completa).
 * titulo: null = sección sin encabezado (Inicio).
 */
const SECCIONES_NAV = [
  {
    titulo: null,
    items: [{ label: 'Inicio', path: '/', icono: LayoutDashboard }],
  },
  {
    titulo: 'Infraestructura',
    items: [
      { label: 'Sedes', path: '/sedes', icono: Building2 },
      { label: 'Subsedes', path: '/subsedes', icono: Building },
      { label: 'Ubicaciones', path: '/ubicaciones-formacion', icono: MapPin },
    ],
  },
  {
    titulo: 'Inventario',
    items: [
      { label: 'Equipos', path: '/equipos', icono: Monitor },
      { label: 'Tipos de Equipo', path: '/tipos-equipo', icono: Tags },
      { label: 'Responsables', path: '/responsables', icono: Users },
      { label: 'Licencias', path: '/licencias-office', icono: KeyRound },
    ],
  },
  {
    titulo: 'Operación',
    items: [
      { label: 'Mantenimientos', path: '/mantenimientos', icono: Wrench },
      { label: 'Novedades', path: '/novedades', icono: TriangleAlert },
      { label: 'Traslados', path: '/traslados', icono: ArrowLeftRight },
      { label: 'Observaciones', path: '/observaciones', icono: MessageSquareText },
    ],
  },
  {
    titulo: 'Comunicación e informes',
    items: [
      { label: 'Correos', path: '/correos', icono: Mail },
      { label: 'Reportes', path: '/reportes', icono: ChartColumn },
    ],
  },
  {
    titulo: 'Administración',
    items: [
      { label: 'Usuarios', path: '/usuarios', icono: UserCog },
      { label: 'Auditoría', path: '/auditoria', icono: ShieldCheck },
      { label: 'Copias de seguridad', path: '/respaldos', icono: DatabaseBackup },
    ],
  },
];

export function AdminLayout() {
  const { user, logout } = useAuth();

  // Comparte caché con el panel de Licencias (misma página 1), así que
  // no es una petición extra cuando se abre esa pantalla.
  const { data: sinActualizar } = useLicenciasSinActualizar();
  const totalSinActualizar = sinActualizar?.meta?.total ?? 0;

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Panel lateral en Negro institucional (#1A1A1A) — norma del acta
          de colores para el "panel lateral de navegación". sticky + h-screen
          + overflow-y-auto en el nav: el menú se desplaza solo, y el pie de
          propiedad queda siempre visible abajo. */}
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-ink">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-sena text-white">
            <Monitor size={18} aria-hidden="true" />
          </span>
          <span className="font-display text-sm font-bold text-white">Inventario SENA</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {SECCIONES_NAV.map((seccion, indice) => (
            <div key={seccion.titulo ?? `seccion-${indice}`} className={indice > 0 ? 'mt-4' : ''}>
              {seccion.titulo && (
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  {seccion.titulo}
                </p>
              )}

              {seccion.items.map((item) => {
                const Icono = item.icono;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${
                        isActive ? 'bg-sena font-medium text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <Icono size={18} className="shrink-0" aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                    {item.path === '/licencias-office' && totalSinActualizar > 0 && (
                      <span
                        className="rounded-full bg-warning px-2 py-0.5 text-xs font-semibold text-ink"
                        title={`${totalSinActualizar} licencia(s) sin actualizar`}
                      >
                        {totalSinActualizar}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <footer className="border-t border-white/10 px-4 py-3 text-[11px] leading-snug text-white/40">
          <p className="font-semibold text-white/60">© {ANIO_ACTUAL} SENA – CIAA</p>
          <p>Centro de la Innovación, la Agroindustria y la Aviación</p>
          <p className="mt-1">Todos los derechos reservados.</p>
        </footer>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-4 border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          {/* Campo confirmado contra UserResource.php: 'nombre', no 'name' */}
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <CircleUser size={18} aria-hidden="true" />
            {user?.nombre}
          </span>
          <button onClick={logout} className="flex items-center gap-1 text-sm text-danger hover:underline">
            <LogOut size={16} aria-hidden="true" />
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