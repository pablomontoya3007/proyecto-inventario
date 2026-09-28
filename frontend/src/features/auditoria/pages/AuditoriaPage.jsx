import { useState } from 'react';
import { useAuditorias } from '../hooks/useAuditoria';
import { AuditoriaTabla } from '../components/AuditoriaTabla';

// Confirmado contra los modelos que llevan static::observe(AuditoriaObserver::class).
const ENTIDADES = [
  { value: 'Equipo', label: 'Equipos' },
  { value: 'Sede', label: 'Sedes' },
  { value: 'Subsede', label: 'Subsedes' },
  { value: 'UbicacionFormacion', label: 'Ubicaciones' },
  { value: 'TipoEquipo', label: 'Tipos de equipo' },
  { value: 'Responsable', label: 'Responsables' },
  { value: 'LicenciaOffice', label: 'Licencias de Office' },
  { value: 'Mantenimiento', label: 'Mantenimientos' },
  { value: 'Traslado', label: 'Traslados' },
];

const ACCIONES = [
  { value: 'creado', label: 'Creado' },
  { value: 'actualizado', label: 'Actualizado' },
  { value: 'eliminado', label: 'Eliminado' },
];

const CAMPO =
  'rounded border border-slate-300 px-2 py-1 text-sm focus:border-sena focus:outline-none focus:ring-1 focus:ring-sena';

export function AuditoriaPage() {
  const [page, setPage] = useState(1);
  const [entidadFiltro, setEntidadFiltro] = useState('');
  const [accionFiltro, setAccionFiltro] = useState('');
  const [usuarioFiltro, setUsuarioFiltro] = useState('');
  const [fechaDesdeFiltro, setFechaDesdeFiltro] = useState('');
  const [fechaHastaFiltro, setFechaHastaFiltro] = useState('');

  const filtros = {
    ...(entidadFiltro ? { entidad: entidadFiltro } : {}),
    ...(accionFiltro ? { accion: accionFiltro } : {}),
    ...(usuarioFiltro ? { usuario: usuarioFiltro } : {}),
    ...(fechaDesdeFiltro ? { fecha_desde: fechaDesdeFiltro } : {}),
    ...(fechaHastaFiltro ? { fecha_hasta: fechaHastaFiltro } : {}),
  };

  const { data, isLoading, isError } = useAuditorias(page, filtros);

  function handleLimpiarFiltros() {
    setEntidadFiltro('');
    setAccionFiltro('');
    setUsuarioFiltro('');
    setFechaDesdeFiltro('');
    setFechaHastaFiltro('');
    setPage(1);
  }

  const hayFiltrosActivos = Object.keys(filtros).length > 0;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-ink">Auditoría</h1>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded border border-slate-200 bg-white p-4">
        <div>
          <label htmlFor="filtro-entidad" className="mb-1 block text-xs font-medium text-slate-600">
            Sección
          </label>
          <select
            id="filtro-entidad"
            value={entidadFiltro}
            onChange={(event) => {
              setEntidadFiltro(event.target.value);
              setPage(1);
            }}
            className={CAMPO}
          >
            <option value="">Todas</option>
            {ENTIDADES.map((entidad) => (
              <option key={entidad.value} value={entidad.value}>
                {entidad.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filtro-accion" className="mb-1 block text-xs font-medium text-slate-600">
            Acción
          </label>
          <select
            id="filtro-accion"
            value={accionFiltro}
            onChange={(event) => {
              setAccionFiltro(event.target.value);
              setPage(1);
            }}
            className={CAMPO}
          >
            <option value="">Todas</option>
            {ACCIONES.map((accion) => (
              <option key={accion.value} value={accion.value}>
                {accion.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filtro-usuario-auditoria" className="mb-1 block text-xs font-medium text-slate-600">
            Usuario
          </label>
          <input
            id="filtro-usuario-auditoria"
            type="text"
            placeholder="Buscar por nombre..."
            value={usuarioFiltro}
            onChange={(event) => {
              setUsuarioFiltro(event.target.value);
              setPage(1);
            }}
            className={CAMPO}
          />
        </div>

        <div>
          <label htmlFor="fecha-desde-auditoria" className="mb-1 block text-xs font-medium text-slate-600">
            Desde
          </label>
          <input
            id="fecha-desde-auditoria"
            type="date"
            value={fechaDesdeFiltro}
            onChange={(event) => {
              setFechaDesdeFiltro(event.target.value);
              setPage(1);
            }}
            className={CAMPO}
          />
        </div>

        <div>
          <label htmlFor="fecha-hasta-auditoria" className="mb-1 block text-xs font-medium text-slate-600">
            Hasta
          </label>
          <input
            id="fecha-hasta-auditoria"
            type="date"
            value={fechaHastaFiltro}
            onChange={(event) => {
              setFechaHastaFiltro(event.target.value);
              setPage(1);
            }}
            className={CAMPO}
          />
        </div>

        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={handleLimpiarFiltros}
            className="text-sm text-slate-500 underline hover:text-ink"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {isLoading && <p className="text-sm text-slate-500">Cargando auditoría...</p>}
      {isError && <p className="text-sm text-danger">No se pudo cargar la auditoría.</p>}

      {data && (
        <>
          <div className="rounded border border-slate-200 bg-white p-4">
            <AuditoriaTabla auditorias={data.data} />
          </div>

          {data.meta && data.meta.last_page > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">
                Anterior
              </button>
              <span>
                Página {data.meta.current_page} de {data.meta.last_page}
              </span>
              <button
                disabled={page >= data.meta.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
