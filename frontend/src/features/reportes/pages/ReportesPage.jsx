import { useState } from 'react';
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

// Confirmado contra app/Enums/EstadoEquipo.php.
const ESTADOS_EQUIPO = [
  { value: 'activo', label: 'Activo' },
  { value: 'mantenimiento', label: 'En mantenimiento' },
  { value: 'de_baja', label: 'De baja' },
  { value: 'extraviado', label: 'Extraviado' },
];

// Vistas de la sección Licencias: el reporte de licencias registradas
// (el de siempre) o el de equipos en uso que no tienen licencia.
const VISTAS_LICENCIAS = [
  { value: 'registradas', label: 'Licencias registradas' },
  { value: 'sin_licencia', label: 'Equipos sin licencia' },
];

// Los tres botones de exportar se repiten igual en cada sección — se
// extrae aquí mismo (no a shared/) porque es un patrón visual propio de
// esta página, no algo que otros módulos necesiten reutilizar.
function BotonesExportar({ onExcel, onPdf, cargandoExcel, cargandoPdf }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onExcel}
        disabled={cargandoExcel}
        className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-surface disabled:opacity-50"
      >
        {cargandoExcel ? 'Generando...' : 'Descargar Excel'}
      </button>
      <button
        onClick={onPdf}
        disabled={cargandoPdf}
        className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-surface disabled:opacity-50"
      >
        {cargandoPdf ? 'Generando...' : 'Descargar PDF'}
      </button>
    </div>
  );
}

export function ReportesPage() {
  const [sedeFiltro, setSedeFiltro] = useState('');
  const [subsedeFiltro, setSubsedeFiltro] = useState('');
  const [ubicacionFiltro, setUbicacionFiltro] = useState('');
  const [tiposFiltro, setTiposFiltro] = useState([]);
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [vistaLicencias, setVistaLicencias] = useState('registradas');
  const [tiposSinLicenciaFiltro, setTiposSinLicenciaFiltro] = useState([]);

  const { data: sedesData } = useSedes(1);
  const { data: subsedesData } = useSubsedes({ page: 1, sedeId: sedeFiltro || undefined });
  const { data: ubicacionesData } = useUbicaciones({ page: 1, subsedeId: subsedeFiltro || undefined });
  const { data: tiposData } = useTiposEquipo();

  // El más específico gana — igual que en EquiposPage. Si hay
  // ubicación elegida, se manda solo esa; si no, solo subsede; si no,
  // solo sede. Nunca se combinan los tres al mismo tiempo.
  const filtroUbicacion = ubicacionFiltro
    ? { ubicacion_formacion_id: ubicacionFiltro }
    : subsedeFiltro
      ? { subsede_id: subsedeFiltro }
      : sedeFiltro
        ? { sede_id: sedeFiltro }
        : {};

  // Filtro de la sección Equipos: el de ubicación + tipos/estado, propios
  // de esta sección (Licencias y Responsables no los usan). Los tipos van
  // como arreglo: axios los manda como tipo_equipo_ids[]=1&tipo_equipo_ids[]=3.
  const filtroEquipos = {
    ...filtroUbicacion,
    ...(tiposFiltro.length > 0 ? { tipo_equipo_ids: tiposFiltro } : {}),
    ...(estadoFiltro ? { estado: estadoFiltro } : {}),
  };

  // Equipos sin licencia: el de ubicación + sus propios tipos (independientes
  // de los de la sección Equipos), p. ej. solo portátiles y todo en uno.
  const filtroSinLicencia = {
    ...filtroUbicacion,
    ...(tiposSinLicenciaFiltro.length > 0 ? { tipo_equipo_ids: tiposSinLicenciaFiltro } : {}),
  };
  const verSinLicencia = vistaLicencias === 'sin_licencia';

  function handleSedeFiltroChange(event) {
    setSedeFiltro(event.target.value);
    setSubsedeFiltro('');
    setUbicacionFiltro('');
  }

  function handleSubsedeFiltroChange(event) {
    setSubsedeFiltro(event.target.value);
    setUbicacionFiltro('');
  }

  const equipos = useReporteEquipos(filtroEquipos);
  const equiposExcel = useDescargarReporteEquiposExcel();
  const equiposPdf = useDescargarReporteEquiposPdf();

  const licencias = useReporteLicencias(filtroUbicacion, { enabled: !verSinLicencia });
  const licenciasExcel = useDescargarReporteLicenciasExcel();
  const licenciasPdf = useDescargarReporteLicenciasPdf();

  const sinLicencia = useReporteEquiposSinLicencia(filtroSinLicencia, { enabled: verSinLicencia });
  const sinLicenciaExcel = useDescargarReporteEquiposSinLicenciaExcel();
  const sinLicenciaPdf = useDescargarReporteEquiposSinLicenciaPdf();

  const responsables = useReporteResponsables(filtroUbicacion);
  const responsablesExcel = useDescargarReporteResponsablesExcel();
  const responsablesPdf = useDescargarReporteResponsablesPdf();

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink">Reportes</h1>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded border border-slate-200 bg-white p-4">
        <div>
          <label htmlFor="filtro-sede-reporte" className="block text-xs font-medium text-slate-600">
            Sede
          </label>
          <select
            id="filtro-sede-reporte"
            value={sedeFiltro}
            onChange={handleSedeFiltroChange}
            className="mt-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-sena focus:outline-none focus:ring-1 focus:ring-sena"
          >
            <option value="">Todas las sedes</option>
            {sedesData?.data.map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filtro-subsede-reporte" className="block text-xs font-medium text-slate-600">
            Subsede
          </label>
          <select
            id="filtro-subsede-reporte"
            value={subsedeFiltro}
            disabled={!sedeFiltro}
            onChange={handleSubsedeFiltroChange}
            className="mt-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-sena focus:outline-none focus:ring-1 focus:ring-sena disabled:bg-surface"
          >
            <option value="">Todas las subsedes</option>
            {subsedesData?.data.map((subsede) => (
              <option key={subsede.id} value={subsede.id}>
                {subsede.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filtro-ubicacion-reporte" className="block text-xs font-medium text-slate-600">
            Ubicación
          </label>
          <select
            id="filtro-ubicacion-reporte"
            value={ubicacionFiltro}
            disabled={!subsedeFiltro}
            onChange={(event) => setUbicacionFiltro(event.target.value)}
            className="mt-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-sena focus:outline-none focus:ring-1 focus:ring-sena disabled:bg-surface"
          >
            <option value="">Todas las ubicaciones</option>
            {ubicacionesData?.data.map((ubicacion) => (
              <option key={ubicacion.id} value={ubicacion.id}>
                {ubicacion.nombre}
              </option>
            ))}
          </select>
        </div>

        {(sedeFiltro || subsedeFiltro || ubicacionFiltro) && (
          <button
            type="button"
            onClick={() => {
              setSedeFiltro('');
              setSubsedeFiltro('');
              setUbicacionFiltro('');
            }}
            className="text-sm text-slate-500 hover:underline"
          >
            Quitar filtro
          </button>
        )}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-ink">Equipos por sede, tipo y estado</h2>
          <BotonesExportar
            onExcel={() => equiposExcel.mutate(filtroEquipos)}
            onPdf={() => equiposPdf.mutate(filtroEquipos)}
            cargandoExcel={equiposExcel.isPending}
            cargandoPdf={equiposPdf.isPending}
          />
        </div>

        <div className="mb-3 flex flex-wrap gap-3">
          <SelectorTiposEquipo tipos={tiposData} seleccionados={tiposFiltro} onChange={setTiposFiltro} />
          <select
            value={estadoFiltro}
            onChange={(event) => setEstadoFiltro(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm focus:border-sena focus:outline-none focus:ring-1 focus:ring-sena"
          >
            <option value="">Todos los estados</option>
            {ESTADOS_EQUIPO.map((estado) => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>
        </div>

        {equipos.isLoading && <p className="text-sm text-slate-500">Cargando...</p>}
        {equipos.isError && <p className="text-sm text-danger">No se pudo cargar el reporte.</p>}
        {equipos.data && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <DesgloseCategoria titulo="Por sede" filas={equipos.data.por_sede} />
              <DesgloseCategoria titulo="Por tipo de equipo" filas={equipos.data.por_tipo} />
              <DesgloseCategoria titulo="Por estado" filas={equipos.data.por_estado} etiquetaClave="estado" />
            </div>

            <div className="mt-4 rounded border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-ink">Listado de equipos</h3>
              <div className="max-h-96 overflow-y-auto">
                <EquiposListadoTabla filas={equipos.data.listado} />
              </div>
            </div>
          </>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-ink">Licencias de Office</h2>
          {verSinLicencia ? (
            <BotonesExportar
              onExcel={() => sinLicenciaExcel.mutate(filtroSinLicencia)}
              onPdf={() => sinLicenciaPdf.mutate(filtroSinLicencia)}
              cargandoExcel={sinLicenciaExcel.isPending}
              cargandoPdf={sinLicenciaPdf.isPending}
            />
          ) : (
            <BotonesExportar
              onExcel={() => licenciasExcel.mutate(filtroUbicacion)}
              onPdf={() => licenciasPdf.mutate(filtroUbicacion)}
              cargandoExcel={licenciasExcel.isPending}
              cargandoPdf={licenciasPdf.isPending}
            />
          )}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-3">
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

          {verSinLicencia && (
            <SelectorTiposEquipo
              tipos={tiposData}
              seleccionados={tiposSinLicenciaFiltro}
              onChange={setTiposSinLicenciaFiltro}
            />
          )}
        </div>

        {verSinLicencia && (
          <>
            {sinLicencia.isLoading && <p className="text-sm text-slate-500">Cargando...</p>}
            {sinLicencia.isError && <p className="text-sm text-danger">No se pudo cargar el reporte.</p>}
            {sinLicencia.data && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  <span className="font-semibold text-ink">{sinLicencia.data.total}</span> equipos en uso sin licencia
                  de Office (no se incluyen equipos de baja ni extraviados).
                </p>

                <DesgloseCategoria titulo="Por tipo de equipo" filas={sinLicencia.data.por_tipo} />

                <div className="rounded border border-slate-200 bg-white p-4">
                  <h3 className="mb-3 text-sm font-semibold text-ink">Listado de equipos sin licencia</h3>
                  <div className="max-h-96 overflow-y-auto">
                    <EquiposSinLicenciaTabla filas={sinLicencia.data.listado} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!verSinLicencia && licencias.isLoading && <p className="text-sm text-slate-500">Cargando...</p>}
        {!verSinLicencia && licencias.isError && <p className="text-sm text-danger">No se pudo cargar el reporte.</p>}
        {!verSinLicencia && licencias.data && (
          <div className="space-y-4">
            <DesgloseCategoria titulo="Por estado" filas={licencias.data.por_estado} etiquetaClave="estado" />

            <div className="rounded border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-ink">Requieren atención (vencidas o suspendidas)</h3>
              <LicenciasAtencionTabla filas={licencias.data.requieren_atencion} />
            </div>

            <div className="rounded border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-ink">Listado completo</h3>
              <div className="max-h-96 overflow-y-auto">
                <LicenciasListadoTabla filas={licencias.data.listado_completo} />
              </div>
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-ink">Cuentadantes con más equipos</h2>
          <BotonesExportar
            onExcel={() => responsablesExcel.mutate(filtroUbicacion)}
            onPdf={() => responsablesPdf.mutate(filtroUbicacion)}
            cargandoExcel={responsablesExcel.isPending}
            cargandoPdf={responsablesPdf.isPending}
          />
        </div>

        {responsables.isLoading && <p className="text-sm text-slate-500">Cargando...</p>}
        {responsables.isError && <p className="text-sm text-danger">No se pudo cargar el reporte.</p>}
        {responsables.data && <DesgloseCategoria titulo="Top 10" filas={responsables.data.top} />}
      </section>
    </div>
  );
}