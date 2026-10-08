import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';

// Tarjeta de estadística. Todas llevan al módulo correspondiente (ya
// filtrado cuando aplica), igual que las de Novedades.
function TarjetaEstadistica({ titulo, valor, tono = 'neutral', irA, ayuda }) {
  const navigate = useNavigate();
  const colores = {
    neutral: 'text-ink',
    success: 'text-sena-dark',
    warning: 'text-warning',
    danger: 'text-danger',
    info: 'text-info',
  };

  return (
    <button
      type="button"
      onClick={() => navigate(irA)}
      className="rounded border border-slate-200 bg-white p-4 text-left transition hover:border-sena hover:shadow-sm"
    >
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className={`mt-1 font-mono text-3xl font-bold ${colores[tono]}`}>{valor ?? 0}</p>
      {ayuda && <p className="mt-1 text-xs text-slate-400">{ayuda}</p>}
    </button>
  );
}

const GRID_CINCO = 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5';

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) return <p className="text-sm text-slate-500">Cargando resumen...</p>;
  if (isError) return <p className="text-sm text-danger">No se pudo cargar el resumen del sistema.</p>;

  const equiposPorEstado = data.equipos.por_estado ?? {};
  const licenciasPorEstado = data.licencias.por_estado ?? {};
  const novedadesSinAtender = data.novedades?.sin_atender ?? 0;
  const novedadesSinAsignar = data.novedades?.sin_asignar ?? 0;
  const sinLicencia = data.equipos.sin_licencia ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink">Inicio</h1>
        <p className="mt-1 text-sm text-slate-500">Haz clic en cualquier contador para ir al módulo.</p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-ink">Novedades</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <TarjetaEstadistica
            titulo="Novedades sin atender"
            valor={novedadesSinAtender}
            tono={novedadesSinAtender > 0 ? 'warning' : 'success'}
            irA="/novedades?estado=abierta"
            ayuda={novedadesSinAtender > 0 ? 'Clic para revisarlas' : 'Todo al día'}
          />
          <TarjetaEstadistica
            titulo="Sin asignar a nadie"
            valor={novedadesSinAsignar}
            tono={novedadesSinAsignar > 0 ? 'danger' : 'success'}
            irA="/novedades?estado=abierta&sin_asignar=1"
            ayuda={novedadesSinAsignar > 0 ? 'Necesitan quién las revise' : 'Todas tienen encargado'}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-ink">Equipos</h2>
        <div className={GRID_CINCO}>
          <TarjetaEstadistica titulo="Total de equipos" valor={data.equipos.total} irA="/equipos" />
          <TarjetaEstadistica titulo="Activos" valor={equiposPorEstado.activo} tono="success" irA="/equipos?estado=activo" />
          <TarjetaEstadistica
            titulo="En mantenimiento"
            valor={equiposPorEstado.mantenimiento}
            tono="warning"
            irA="/equipos?estado=mantenimiento"
          />
          <TarjetaEstadistica titulo="De baja" valor={equiposPorEstado.de_baja} tono="danger" irA="/equipos?estado=de_baja" />
          <TarjetaEstadistica
            titulo="Extraviados"
            valor={equiposPorEstado.extraviado}
            tono="danger"
            irA="/equipos?estado=extraviado"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-ink">Licencias de Office</h2>
        <div className={GRID_CINCO}>
          <TarjetaEstadistica titulo="Total de licencias" valor={data.licencias.total} irA="/licencias-office" />
          <TarjetaEstadistica
            titulo="Activas"
            valor={licenciasPorEstado.activa}
            tono="success"
            irA="/licencias-office?estado=activa"
          />
          <TarjetaEstadistica
            titulo="Vencidas"
            valor={licenciasPorEstado.vencida}
            tono="danger"
            irA="/licencias-office?estado=vencida"
          />
          <TarjetaEstadistica
            titulo="Suspendidas"
            valor={licenciasPorEstado.suspendida}
            tono="info"
            irA="/licencias-office?estado=suspendida"
          />
          <TarjetaEstadistica
            titulo="Equipos sin licencia"
            valor={sinLicencia}
            tono={sinLicencia > 0 ? 'warning' : 'success'}
            irA="/equipos?sin_licencia=1"
            ayuda="Equipos en uso sin licencia"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-ink">Mantenimientos y personas</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <TarjetaEstadistica
            titulo="Mantenimientos pendientes"
            valor={data.mantenimientos_pendientes}
            tono="warning"
            irA="/mantenimientos"
          />
          <TarjetaEstadistica titulo="Responsables" valor={data.responsables_total} irA="/responsables" />
          <TarjetaEstadistica titulo="Usuarios del sistema" valor={data.usuarios_total} irA="/usuarios" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-ink">Estructura</h2>
        <div className="grid grid-cols-3 gap-4">
          <TarjetaEstadistica titulo="Sedes" valor={data.estructura.sedes} irA="/sedes" />
          <TarjetaEstadistica titulo="Subsedes" valor={data.estructura.subsedes} irA="/subsedes" />
          <TarjetaEstadistica titulo="Ubicaciones" valor={data.estructura.ubicaciones} irA="/ubicaciones-formacion" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink">Últimas observaciones</h2>
          {data.ultimas_observaciones.length === 0 ? (
            <p className="text-sm text-slate-400">Sin observaciones registradas todavía.</p>
          ) : (
            <ul className="space-y-3">
              {data.ultimas_observaciones.map((obs, indice) => (
                <li key={indice} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium text-ink">{obs.equipo}</span>
                    <span className="text-xs text-slate-400">{obs.fecha}</span>
                  </div>
                  <p className="text-slate-600">{obs.descripcion}</p>
                  <p className="text-xs text-slate-400">— {obs.usuario}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink">Responsables con más equipos</h2>
          {data.responsables_top.length === 0 ? (
            <p className="text-sm text-slate-400">Sin datos todavía.</p>
          ) : (
            <ul className="space-y-2">
              {data.responsables_top.map((responsable, indice) => (
                <li key={indice} className="flex justify-between text-sm">
                  <span className="text-ink">{responsable.nombre}</span>
                  <span className="font-mono text-slate-500">{responsable.total}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}