import { useState } from 'react';
import {
  useReporteEquipos,
  useDescargarReporteEquiposExcel,
  useDescargarReporteEquiposPdf,
  useReporteLicencias,
  useDescargarReporteLicenciasExcel,
  useDescargarReporteLicenciasPdf,
  useReporteResponsables,
  useDescargarReporteResponsablesExcel,
  useDescargarReporteResponsablesPdf,
} from '../hooks/useReportes';
import { useTiposEquipo } from '../../tipos-equipo/hooks/useTiposEquipo';
import { useSedes } from '../../sedes/hooks/useSedes';
import { useSubsedes } from '../../subsedes/hooks/useSubsedes';
import { useUbicaciones } from '../../ubicaciones/hooks/useUbicaciones';
import { FiltroUbicacionCascada } from '../../../shared/components/FiltroUbicacionCascada';
import { DesgloseCategoria } from '../components/DesgloseCategoria';
import { EquiposListadoTabla } from '../components/EquiposListadoTabla';
import { LicenciasAtencionTabla } from '../components/LicenciasAtencionTabla';
import { LicenciasListadoTabla } from '../components/LicenciasListadoTabla';

// Confirmado contra app/Enums/EstadoEquipo.php.
const ESTADOS_EQUIPO = [
  { value: 'activo', label: 'Activo' },
  { value: 'mantenimiento', label: 'En mantenimiento' },
  { value: 'de_baja', label: 'De baja' },
  { value: 'extraviado', label: 'Extraviado' },
];

function BotonesExportar({ onExcel, onPdf, cargandoExcel, cargandoPdf }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onExcel}
        disabled={cargandoExcel}
        className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        {cargandoExcel ? 'Generando...' : 'Descargar Excel'}
      </button>
      <button
        onClick={onPdf}
        disabled={cargandoPdf}
        className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
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
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');

  function handleSedeChange(valor) {
    setSedeFiltro(valor);
    setSubsedeFiltro('');
    setUbicacionFiltro('');
  }

  function handleSubsedeChange(valor) {
    setSubsedeFiltro(valor);
    setUbicacionFiltro('');
  }

  function handleLimpiarFiltros() {
    setSedeFiltro('');
    setSubsedeFiltro('');
    setUbicacionFiltro('');
  }

  // Filtro de ubicación: compartido por las tres secciones.
  const filtros = {
    ...(ubicacionFiltro
      ? { ubicacion_formacion_id: ubicacionFiltro }
      : subsedeFiltro
        ? { subsede_id: subsedeFiltro }
        : sedeFiltro
          ? { sede_id: sedeFiltro }
          : {}),
  };

  // Filtro de la sección Equipos: el de ubicación + tipo/estado, propios
  // de esta sección (Licencias y Responsables no los usan).
  const equiposFiltros = {
    ...filtros,
    ...(tipoFiltro ? { tipo_equipo_id: tipoFiltro } : {}),
    ...(estadoFiltro ? { estado: estadoFiltro } : {}),
  };

  const { data: sedesData } = useSedes(1);
  const { data: subsedesData } = useSubsedes({ page: 1, sedeId: sedeFiltro || undefined });
  const { data: ubicacionesData } = useUbicaciones({ page: 1, subsedeId: subsedeFiltro || undefined });
  const { data: tiposData } = useTiposEquipo();

  const equipos = useReporteEquipos(equiposFiltros);
  const equiposExcel = useDescargarReporteEquiposExcel();
  const equiposPdf = useDescargarReporteEquiposPdf();

  const licencias = useReporteLicencias(filtros);
  const licenciasExcel = useDescargarReporteLicenciasExcel();
  const licenciasPdf = useDescargarReporteLicenciasPdf();

  const responsables = useReporteResponsables(filtros);
  const responsablesExcel = useDescargarReporteResponsablesExcel();
  const responsablesPdf = useDescargarReporteResponsablesPdf();

  return (
    <div className="space-y-10">
      <h1 className="text-xl font-semibold text-slate-800">Reportes</h1>

      <FiltroUbicacionCascada
        sedesData={sedesData}
        subsedesData={subsedesData}
        ubicacionesData={ubicacionesData}
        sedeFiltro={sedeFiltro}
        subsedeFiltro={subsedeFiltro}
        ubicacionFiltro={ubicacionFiltro}
        onSedeChange={handleSedeChange}
        onSubsedeChange={handleSubsedeChange}
        onUbicacionChange={setUbicacionFiltro}
        onLimpiar={handleLimpiarFiltros}
      />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-700">Equipos por sede, tipo y estado</h2>
          <BotonesExportar
            onExcel={() => equiposExcel.mutate(equiposFiltros)}
            onPdf={() => equiposPdf.mutate(equiposFiltros)}
            cargandoExcel={equiposExcel.isPending}
            cargandoPdf={equiposPdf.isPending}
          />
        </div>

        <div className="mb-3 flex flex-wrap gap-3">
          <select
            value={tipoFiltro}
            onChange={(event) => setTipoFiltro(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="">Todos los tipos</option>
            {tiposData?.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
          <select
            value={estadoFiltro}
            onChange={(event) => setEstadoFiltro(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
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
        {equipos.isError && <p className="text-sm text-red-600">No se pudo cargar el reporte.</p>}
        {equipos.data && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <DesgloseCategoria titulo="Por sede" filas={equipos.data.por_sede} />
              <DesgloseCategoria titulo="Por tipo de equipo" filas={equipos.data.por_tipo} />
              <DesgloseCategoria titulo="Por estado" filas={equipos.data.por_estado} etiquetaClave="estado" />
            </div>

            <div className="mt-4 rounded border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Listado de equipos</h3>
              <div className="max-h-96 overflow-y-auto">
                <EquiposListadoTabla filas={equipos.data.listado} />
              </div>
            </div>
          </>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-700">Licencias de Office</h2>
          <BotonesExportar
            onExcel={() => licenciasExcel.mutate(filtros)}
            onPdf={() => licenciasPdf.mutate(filtros)}
            cargandoExcel={licenciasExcel.isPending}
            cargandoPdf={licenciasPdf.isPending}
          />
        </div>

        {licencias.isLoading && <p className="text-sm text-slate-500">Cargando...</p>}
        {licencias.isError && <p className="text-sm text-red-600">No se pudo cargar el reporte.</p>}
        {licencias.data && (
          <div className="space-y-4">
            <DesgloseCategoria titulo="Por estado" filas={licencias.data.por_estado} etiquetaClave="estado" />

            <div className="rounded border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">
                Requieren atención (vencidas o suspendidas)
              </h3>
              <LicenciasAtencionTabla filas={licencias.data.requieren_atencion} />
            </div>

            <div className="rounded border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Listado completo</h3>
              <div className="max-h-96 overflow-y-auto">
                <LicenciasListadoTabla filas={licencias.data.listado_completo} />
              </div>
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-700">Responsables con más equipos</h2>
          <BotonesExportar
            onExcel={() => responsablesExcel.mutate(filtros)}
            onPdf={() => responsablesPdf.mutate(filtros)}
            cargandoExcel={responsablesExcel.isPending}
            cargandoPdf={responsablesPdf.isPending}
          />
        </div>

        {responsables.isLoading && <p className="text-sm text-slate-500">Cargando...</p>}
        {responsables.isError && <p className="text-sm text-red-600">No se pudo cargar el reporte.</p>}
        {responsables.data && <DesgloseCategoria titulo="Top 10" filas={responsables.data.top} />}
      </section>
    </div>
  );
}