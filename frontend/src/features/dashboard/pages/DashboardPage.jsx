import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';

// Tarjeta de estadística simple — se define aquí mismo (no en
// shared/) porque es un patrón visual propio de esta página, igual
// que BotonesExportar en ReportesPage. Si recibe alHacerClic, se
// renderiza como botón (lleva al módulo correspondiente).
function TarjetaEstadistica({ titulo, valor, tono = 'neutral', alHacerClic, ayuda }) {
  const colores = {
    neutral: 'text-ink',
    success: 'text-sena-dark',
    warning: 'text-warning',
    danger: 'text-danger',
    info: 'text-info',
  };

  const contenido = (
    <>
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className={`mt-1 font-mono text-3xl font-bold ${colores[tono]}`}>{valor}</p>
      {ayuda && <p className="mt-1 text-xs text-slate-400">{ayuda}</p>}
    </>
  );

  if (alHacerClic) {
    return (
      <button
        type="button"
        onClick={alHacerClic}
        className="rounded border border-slate-200 bg-white p-4 text-left transition hover:border-sena hover:shadow-sm"
      >
        {contenido}
      </button>
    );
  }

  return <div className="rounded border border-slate-200 bg-white p-4">{contenido}</div>;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) return <p className="text-sm text-slate-500">Cargando resumen...</p>;
  if (isError) return <p className="text-sm text-danger">No se pudo cargar el resumen del sistema.</p>;

  // ?? 0: si el backend todavía no tiene la versión con novedades (por
  // ejemplo, en un servidor sin actualizar), la página no se rompe.
  const novedadesSinAtender = data.novedades?.sin_atender ?? 0;
  const novedadesSinAsignar = data.novedades?.sin_asignar ?? 0;
  const verNovedadesAbiertas = () => navigate('/novedades?estado=abierta');

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-ink">Inicio</h1>

      <section>
        <h2 className="mb-3 text-lg font-medium text-ink">Novedades</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <TarjetaEstadistica
            titulo="Novedades sin atender"
            valor={novedadesSinAtender}
            tono={novedadesSinAtender > 0 ? 'warning' : 'success'}
            alHacerClic={verNovedadesAbiertas}
            ayuda={novedadesSinAtender > 0 ? 'Clic para revisarlas' : 'Todo al día'}
          />
          <TarjetaEstadistica
            titulo="Sin asignar a nadie"
            valor={novedadesSinAsignar}
            tono={novedadesSinAsignar > 0 ? 'danger' : 'success'}
            alHacerClic={verNovedadesAbiertas}
            ayuda={novedadesSinAsignar > 0 ? 'Necesitan un responsable de revisión' : 'Todas tienen encargado'}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-ink">Equipos</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <TarjetaEstadistica titulo="Total de equipos" valor={data.equipos.total} />
          <TarjetaEstadistica titulo="Activos" valor={data.equipos.activos} tono="success" />
          <TarjetaEstadistica titulo="En mantenimiento" valor={data.equipos.en_mantenimiento} tono="warning" />
          <TarjetaEstadistica titulo="En mal estado" valor={data.equipos.en_mal_estado} tono="danger" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-ink">Licencias y mantenimientos</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <TarjetaEstadistica titulo="Licencias vencidas" valor={data.licencias.vencidas} tono="danger" />
          <TarjetaEstadistica titulo="Licencias suspendidas" valor={data.licencias.suspendidas} tono="info" />
          <TarjetaEstadistica titulo="Mantenimientos pendientes" valor={data.mantenimientos_pendientes} tono="warning" />
          <TarjetaEstadistica titulo="Responsables" valor={data.responsables_total} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-ink">Estructura</h2>
        <div className="grid grid-cols-3 gap-4">
          <TarjetaEstadistica titulo="Sedes" valor={data.estructura.sedes} />
          <TarjetaEstadistica titulo="Subsedes" valor={data.estructura.subsedes} />
          <TarjetaEstadistica titulo="Ubicaciones" valor={data.estructura.ubicaciones} />
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