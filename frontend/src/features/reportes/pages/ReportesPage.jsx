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
import { useSedes } from '../../sedes/hooks/useSedes';
import { useSubsedes } from '../../subsedes/hooks/useSubsedes';
import { useUbicaciones } from '../../ubicaciones/hooks/useUbicaciones';
import { FiltroUbicacionCascada } from '../../../shared/components/FiltroUbicacionCascada';
import { DesgloseCategoria } from '../components/DesgloseCategoria';
import { LicenciasAtencionTabla } from '../components/LicenciasAtencionTabla';
import { LicenciasListadoTabla } from '../components/LicenciasListadoTabla';

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

  const filtros = {
    ...(ubicacionFiltro
      ? { ubicacion_formacion_id: ubicacionFiltro }
      : subsedeFiltro
        ? { subsede_id: subsedeFiltro }
        : sedeFiltro
          ? { sede_id: sedeFiltro }
          : {}),
  };

  const { data: sedesData } = useSedes(1);
  const { data: subsedesData } = useSubsedes({ page: 1, sedeId: sedeFiltro || undefined });
  const { data: ubicacionesData } = useUbicaciones({ page: 1, subsedeId: subsedeFiltro || undefined });

  const equipos = useReporteEquipos(filtros);
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
            onExcel={() => equiposExcel.mutate(filtros)}
            onPdf={() => equiposPdf.mutate(filtros)}
            cargandoExcel={equiposExcel.isPending}
            cargandoPdf={equiposPdf.isPending}
          />
        </div>

        {equipos.isLoading && <p className="text-sm text-slate-500">Cargando...</p>}
        {equipos.isError && <p className="text-sm text-red-600">No se pudo cargar el reporte.</p>}
        {equipos.data && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <DesgloseCategoria titulo="Por sede" filas={equipos.data.por_sede} />
            <DesgloseCategoria titulo="Por tipo de equipo" filas={equipos.data.por_tipo} />
            <DesgloseCategoria titulo="Por estado" filas={equipos.data.por_estado} etiquetaClave="estado" />
          </div>
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