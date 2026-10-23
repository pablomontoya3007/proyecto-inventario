import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useReporteEquipos,
  useDescargarReporteEquiposExcel,
  useDescargarReporteEquiposPdf,
  useReporteLicencias,
  useDescargarReporteLicenciasExcel,
  useDescargarReporteLicenciasPdf,
  useReporteEquiposSinLicencia,
  useDescargarReporteEquiposSinLicenciaExcel,
  useDescargarReporteEquiposSinLicenciaPdf,
  useReporteResponsables,
  useDescargarReporteResponsablesExcel,
  useDescargarReporteResponsablesPdf,
} from '../hooks/useReportes';
import { useTiposEquipo } from '../../tipos-equipo/hooks/useTiposEquipo';
import { useSedes } from '../../sedes/hooks/useSedes';
import { useSubsedes } from '../../subsedes/hooks/useSubsedes';
import { useUbicaciones } from '../../ubicaciones/hooks/useUbicaciones';
import { DesgloseCategoria } from '../components/DesgloseCategoria';
import { EquiposListadoTabla } from '../components/EquiposListadoTabla';
import { LicenciasAtencionTabla } from '../components/LicenciasAtencionTabla';
import { LicenciasListadoTabla } from '../components/LicenciasListadoTabla';
import { EquiposSinLicenciaTabla } from '../components/EquiposSinLicenciaTabla';
import { SelectorTiposEquipo } from '../components/SelectorTiposEquipo';
import { SelectorColumnas } from '../components/SelectorColumnas';
import { TIPOS_USO } from '../../../shared/constants/tiposUso';

// Confirmado contra app/Enums/EstadoEquipo.php.
const ESTADOS_EQUIPO = [
  { value: 'activo', label: 'Activo' },
  { value: 'mantenimiento', label: 'En mantenimiento' },
  { value: 'de_baja', label: 'De baja' },
  { value: 'extraviado', label: 'Extraviado' },
];

/**
 * Un reporte a la vez, en pestañas: cada uno tiene su propia tarjeta con
 * el título, sus filtros y SUS botones de descarga juntos, así no hay
 * duda de qué se descarga. La pestaña activa queda en la URL
 * (?reporte=licencias) para que al recargar no se pierda.
 */
const REPORTES = [
  {
    value: 'equipos',
    label: 'Equipos',
    descripcion: 'Totales por sede, tipo, estado y tipo de uso, y el listado de equipos con las columnas que elijas.',
  },
  {
    value: 'licencias',
    label: 'Licencias de Office',
    descripcion: 'Licencias registradas por estado, o los equipos en uso que todavía no tienen licencia.',
  },
  {
    value: 'cuentadantes',
    label: 'Cuentadantes',
    descripcion: 'Los 10 cuentadantes con más equipos a su cargo.',
  },
];

// Vistas de la pestaña Licencias: el reporte de licencias registradas
// (el de siempre) o el de equipos en uso que no tienen licencia.
const VISTAS_LICENCIAS = [
  { value: 'registradas', label: 'Licencias registradas' },
  { value: 'sin_licencia', label: 'Equipos sin licencia' },
];

const CLASE_SELECT =
  'rounded border border-slate-300 px-2 py-1 text-sm focus:border-sena focus:outline-none focus:ring-1 focus:ring-sena disabled:bg-surface';

/**
 * Los dos botones van en la cabecera de la tarjeta del reporte, junto a
 * su título: descargan exactamente lo que muestran los filtros de abajo.
 */
function BotonesDescarga({ nombre, onExcel, onPdf, cargandoExcel, cargandoPdf }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onExcel}
        disabled={cargandoExcel}
        aria-label={`Descargar ${nombre} en Excel`}
        className="rounded border border-sena px-3 py-1.5 text-sm font-medium text-sena-dark hover:bg-sena-soft disabled:opacity-50"
      >
        {cargandoExcel ? 'Generando...' : 'Descargar Excel'}
      </button>
      <button
        type="button"
        onClick={onPdf}
        disabled={cargandoPdf}
        aria-label={`Descargar ${nombre} en PDF`}
        className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-surface disabled:opacity-50"
      >
        {cargandoPdf ? 'Generando...' : 'Descargar PDF'}
      </button>
    </div>
  );
}

function Campo({ etiqueta, htmlFor, children }) {
  return (
    <div>
      {htmlFor ? (
        <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-slate-600">
          {etiqueta}
        </label>
      ) : (
        <span className="mb-1 block text-xs font-medium text-slate-600">{etiqueta}</span>
      )}
      {children}
    </div>
  );
}

function EstadoCarga({ consulta }) {
  if (consulta.isLoading) return <p className="text-sm text-slate-500">Cargando...</p>;
  if (consulta.isError) return <p className="text-sm text-danger">No se pudo cargar el reporte.</p>;
  return null;
}

export function ReportesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const reporteUrl = searchParams.get('reporte');
  const reporte = REPORTES.some((opcion) => opcion.value === reporteUrl) ? reporteUrl : 'equipos';
  const reporteActual = REPORTES.find((opcion) => opcion.value === reporte);

  const [sedeFiltro, setSedeFiltro] = useState('');
  const [subsedeFiltro, setSubsedeFiltro] = useState('');
  const [ubicacionFiltro, setUbicacionFiltro] = useState('');
  const [tiposFiltro, setTiposFiltro] = useState([]);
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [tipoUsoFiltro, setTipoUsoFiltro] = useState('');
  const [columnas, setColumnas] = useState([]);
  const [vistaLicencias, setVistaLicencias] = useState('registradas');
  const [tiposSinLicenciaFiltro, setTiposSinLicenciaFiltro] = useState([]);

  const { data: sedesData } = useSedes(1);
  const { data: subsedesData } = useSubsedes({ page: 1, sedeId: sedeFiltro || undefined });
  const { data: ubicacionesData } = useUbicaciones({ page: 1, subsedeId: subsedeFiltro || undefined });
  const { data: tiposData } = useTiposEquipo();

  // El más específico gana — igual que en EquiposPage. Si hay
  // ubicación elegida, se manda solo esa; si no, solo subsede; si no,
  // solo sede. Nunca se combinan los tres al mismo tiempo. Este filtro
  // es común a las tres pestañas (se conserva al cambiar de pestaña).
  const filtroUbicacion = ubicacionFiltro
    ? { ubicacion_formacion_id: ubicacionFiltro }
    : subsedeFiltro
      ? { subsede_id: subsedeFiltro }
      : sedeFiltro
        ? { sede_id: sedeFiltro }
        : {};

  // Equipos: ubicación + tipos + estado + tipo de uso + columnas del listado. Los
  // arreglos viajan como tipo_equipo_ids[]=1&columnas[]=serial (axios).
  const filtroEquipos = {
    ...filtroUbicacion,
    ...(tiposFiltro.length > 0 ? { tipo_equipo_ids: tiposFiltro } : {}),
    ...(estadoFiltro ? { estado: estadoFiltro } : {}),
    ...(tipoUsoFiltro ? { tipo_uso: tipoUsoFiltro } : {}),
    ...(columnas.length > 0 ? { columnas } : {}),
  };

  // Equipos sin licencia: ubicación + sus propios tipos (independientes
  // de los de la pestaña Equipos), p. ej. solo portátiles y todo en uno.
  const filtroSinLicencia = {
    ...filtroUbicacion,
    ...(tiposSinLicenciaFiltro.length > 0 ? { tipo_equipo_ids: tiposSinLicenciaFiltro } : {}),
  };
  const verSinLicencia = vistaLicencias === 'sin_licencia';

  // Cada consulta corre solo cuando su pestaña está visible.
  const equipos = useReporteEquipos(filtroEquipos, { enabled: reporte === 'equipos' });
  const equiposExcel = useDescargarReporteEquiposExcel();
  const equiposPdf = useDescargarReporteEquiposPdf();

  const licencias = useReporteLicencias(filtroUbicacion, { enabled: reporte === 'licencias' && !verSinLicencia });
  const licenciasExcel = useDescargarReporteLicenciasExcel();
  const licenciasPdf = useDescargarReporteLicenciasPdf();

  const sinLicencia = useReporteEquiposSinLicencia(filtroSinLicencia, {
    enabled: reporte === 'licencias' && verSinLicencia,
  });
  const sinLicenciaExcel = useDescargarReporteEquiposSinLicenciaExcel();
  const sinLicenciaPdf = useDescargarReporteEquiposSinLicenciaPdf();

  const responsables = useReporteResponsables(filtroUbicacion, { enabled: reporte === 'cuentadantes' });
  const responsablesExcel = useDescargarReporteResponsablesExcel();
  const responsablesPdf = useDescargarReporteResponsablesPdf();

  function cambiarReporte(valor) {
    setSearchParams(valor === 'equipos' ? {} : { reporte: valor }, { replace: true });
  }

  function handleSedeFiltroChange(event) {
    setSedeFiltro(event.target.value);
    setSubsedeFiltro('');
    setUbicacionFiltro('');
  }

  function handleSubsedeFiltroChange(event) {
    setSubsedeFiltro(event.target.value);
    setUbicacionFiltro('');
  }

  function limpiarUbicacion() {
    setSedeFiltro('');
    setSubsedeFiltro('');
    setUbicacionFiltro('');
  }

  // Los botones de descarga de la cabecera dependen de la pestaña (y,
  // en Licencias, de la vista elegida).
  const descarga = {
    equipos: {
      nombre: 'el reporte de equipos',
      onExcel: () => equiposExcel.mutate(filtroEquipos),
      onPdf: () => equiposPdf.mutate(filtroEquipos),
      cargandoExcel: equiposExcel.isPending,
      cargandoPdf: equiposPdf.isPending,
    },
    licencias: verSinLicencia
      ? {
          nombre: 'el reporte de equipos sin licencia',
          onExcel: () => sinLicenciaExcel.mutate(filtroSinLicencia),
          onPdf: () => sinLicenciaPdf.mutate(filtroSinLicencia),
          cargandoExcel: sinLicenciaExcel.isPending,
          cargandoPdf: sinLicenciaPdf.isPending,
        }
      : {
          nombre: 'el reporte de licencias',
          onExcel: () => licenciasExcel.mutate(filtroUbicacion),
          onPdf: () => licenciasPdf.mutate(filtroUbicacion),
          cargandoExcel: licenciasExcel.isPending,
          cargandoPdf: licenciasPdf.isPending,
        },
    cuentadantes: {
      nombre: 'el reporte de cuentadantes',
      onExcel: () => responsablesExcel.mutate(filtroUbicacion),
      onPdf: () => responsablesPdf.mutate(filtroUbicacion),
      cargandoExcel: responsablesExcel.isPending,
      cargandoPdf: responsablesPdf.isPending,
    },
  }[reporte];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Reportes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Elige un reporte, ajusta los filtros y descárgalo en Excel o PDF tal como lo ves.
        </p>
      </div>

      <div role="tablist" aria-label="Reportes disponibles" className="flex flex-wrap gap-1 border-b border-slate-200">
        {REPORTES.map((opcion) => {
          const activa = opcion.value === reporte;

          return (
            <button
              key={opcion.value}
              type="button"
              role="tab"
              aria-selected={activa}
              onClick={() => cambiarReporte(opcion.value)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                activa ? 'border-sena text-sena-dark' : 'border-transparent text-slate-500 hover:text-ink'
              }`}
            >
              {opcion.label}
            </button>
          );
        })}
      </div>

      {/* Tarjeta del reporte: título + descargas arriba, filtros abajo. */}
      <section className="rounded border border-slate-200 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">{reporteActual.label}</h2>
            <p className="text-sm text-slate-500">{reporteActual.descripcion}</p>
          </div>
          <BotonesDescarga {...descarga} />
        </div>

        <div className="space-y-4 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <Campo etiqueta="Sede" htmlFor="filtro-sede-reporte">
              <select id="filtro-sede-reporte" value={sedeFiltro} onChange={handleSedeFiltroChange} className={CLASE_SELECT}>
                <option value="">Todas las sedes</option>
                {sedesData?.data.map((sede) => (
                  <option key={sede.id} value={sede.id}>
                    {sede.nombre}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo etiqueta="Subsede" htmlFor="filtro-subsede-reporte">
              <select
                id="filtro-subsede-reporte"
                value={subsedeFiltro}
                disabled={!sedeFiltro}
                onChange={handleSubsedeFiltroChange}
                className={CLASE_SELECT}
              >
                <option value="">Todas las subsedes</option>
                {subsedesData?.data.map((subsede) => (
                  <option key={subsede.id} value={subsede.id}>
                    {subsede.nombre}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo etiqueta="Ubicación" htmlFor="filtro-ubicacion-reporte">
              <select
                id="filtro-ubicacion-reporte"
                value={ubicacionFiltro}
                disabled={!subsedeFiltro}
                onChange={(event) => setUbicacionFiltro(event.target.value)}
                className={CLASE_SELECT}
              >
                <option value="">Todas las ubicaciones</option>
                {ubicacionesData?.data.map((ubicacion) => (
                  <option key={ubicacion.id} value={ubicacion.id}>
                    {ubicacion.nombre}
                  </option>
                ))}
              </select>
            </Campo>

            {reporte === 'equipos' && (
              <>
                <Campo etiqueta="Tipos de equipo">
                  <SelectorTiposEquipo tipos={tiposData} seleccionados={tiposFiltro} onChange={setTiposFiltro} />
                </Campo>
                <Campo etiqueta="Estado" htmlFor="filtro-estado-reporte">
                  <select
                    id="filtro-estado-reporte"
                    value={estadoFiltro}
                    onChange={(event) => setEstadoFiltro(event.target.value)}
                    className={CLASE_SELECT}
                  >
                    <option value="">Todos los estados</option>
                    {ESTADOS_EQUIPO.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo etiqueta="Tipo de uso" htmlFor="filtro-tipo-uso-reporte">
                  <select
                    id="filtro-tipo-uso-reporte"
                    value={tipoUsoFiltro}
                    onChange={(event) => setTipoUsoFiltro(event.target.value)}
                    className={CLASE_SELECT}
                  >
                    <option value="">Todos los usos</option>
                    {TIPOS_USO.map((tipoUso) => (
                      <option key={tipoUso.value} value={tipoUso.value}>
                        {tipoUso.label}
                      </option>
                    ))}
                  </select>
                </Campo>
              </>
            )}

            {reporte === 'licencias' && verSinLicencia && (
              <Campo etiqueta="Tipos de equipo">
                <SelectorTiposEquipo
                  tipos={tiposData}
                  seleccionados={tiposSinLicenciaFiltro}
                  onChange={setTiposSinLicenciaFiltro}
                />
              </Campo>
            )}

            {(sedeFiltro || subsedeFiltro || ubicacionFiltro) && (
              <button type="button" onClick={limpiarUbicacion} className="pb-1 text-sm text-slate-500 underline hover:text-ink">
                Quitar ubicación
              </button>
            )}
          </div>

          {reporte === 'equipos' && <SelectorColumnas seleccionadas={columnas} onChange={setColumnas} />}

          {reporte === 'licencias' && (
            <div>
              <span className="mb-1 block text-xs font-medium text-slate-600">Qué mostrar</span>
              <div role="group" aria-label="Tipo de reporte de licencias" className="inline-flex rounded border border-slate-300">
                {VISTAS_LICENCIAS.map((vista) => (
                  <button
                    key={vista.value}
                    type="button"
                    aria-pressed={vistaLicencias === vista.value}
                    onClick={() => setVistaLicencias(vista.value)}
                    className={`px-3 py-1 text-sm first:rounded-l last:rounded-r ${
                      vistaLicencias === vista.value ? 'bg-sena text-white' : 'text-slate-600 hover:bg-surface'
                    }`}
                  >
                    {vista.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Resultados del reporte activo. */}
      {reporte === 'equipos' && (
        <div className="space-y-4">
          <EstadoCarga consulta={equipos} />
          {equipos.data && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DesgloseCategoria titulo="Por sede" filas={equipos.data.por_sede} />
                <DesgloseCategoria titulo="Por tipo de equipo" filas={equipos.data.por_tipo} />
                <DesgloseCategoria titulo="Por estado" filas={equipos.data.por_estado} etiquetaClave="estado" />
                <DesgloseCategoria titulo="Por tipo de uso" filas={equipos.data.por_uso ?? []} etiquetaClave="tipo_uso" />
              </div>

              <div className="rounded border border-slate-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-ink">
                  Listado de equipos{' '}
                  <span className="font-normal text-slate-400">({equipos.data.listado.length})</span>
                </h3>
                <div className="max-h-[32rem] overflow-auto">
                  <EquiposListadoTabla columnas={equipos.data.columnas} filas={equipos.data.listado} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {reporte === 'licencias' && verSinLicencia && (
        <div className="space-y-4">
          <EstadoCarga consulta={sinLicencia} />
          {sinLicencia.data && (
            <>
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-ink">{sinLicencia.data.total}</span> equipos en uso sin licencia de
                Office (no se incluyen equipos de baja ni extraviados).
              </p>

              <DesgloseCategoria titulo="Por tipo de equipo" filas={sinLicencia.data.por_tipo} />

              <div className="rounded border border-slate-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-ink">Listado de equipos sin licencia</h3>
                <div className="max-h-[32rem] overflow-auto">
                  <EquiposSinLicenciaTabla filas={sinLicencia.data.listado} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {reporte === 'licencias' && !verSinLicencia && (
        <div className="space-y-4">
          <EstadoCarga consulta={licencias} />
          {licencias.data && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <DesgloseCategoria titulo="Por estado" filas={licencias.data.por_estado} etiquetaClave="estado" />
                <div className="rounded border border-slate-200 bg-white p-4 md:col-span-2">
                  <h3 className="mb-3 text-sm font-semibold text-ink">Requieren atención (vencidas o suspendidas)</h3>
                  <div className="max-h-64 overflow-auto">
                    <LicenciasAtencionTabla filas={licencias.data.requieren_atencion} />
                  </div>
                </div>
              </div>

              <div className="rounded border border-slate-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-ink">Listado completo</h3>
                <div className="max-h-[32rem] overflow-auto">
                  <LicenciasListadoTabla filas={licencias.data.listado_completo} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {reporte === 'cuentadantes' && (
        <div className="space-y-4">
          <EstadoCarga consulta={responsables} />
          {responsables.data && <DesgloseCategoria titulo="Top 10 cuentadantes" filas={responsables.data.top} />}
        </div>
      )}
    </div>
  );
}