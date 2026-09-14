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
import { DesgloseCategoria } from '../components/DesgloseCategoria';
import { LicenciasAtencionTabla } from '../components/LicenciasAtencionTabla';

// Los tres botones de exportar se repiten igual en cada sección — se
// extrae aquí mismo (no a shared/) porque es un patrón visual propio de
// esta página, no algo que otros módulos necesiten reutilizar.
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
  const equipos = useReporteEquipos();
  const equiposExcel = useDescargarReporteEquiposExcel();
  const equiposPdf = useDescargarReporteEquiposPdf();

  const licencias = useReporteLicencias();
  const licenciasExcel = useDescargarReporteLicenciasExcel();
  const licenciasPdf = useDescargarReporteLicenciasPdf();

  const responsables = useReporteResponsables();
  const responsablesExcel = useDescargarReporteResponsablesExcel();
  const responsablesPdf = useDescargarReporteResponsablesPdf();

  return (
    <div className="space-y-10">
      <h1 className="text-xl font-semibold text-slate-800">Reportes</h1>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-700">Equipos por sede, tipo y estado</h2>
          <BotonesExportar
            onExcel={() => equiposExcel.mutate()}
            onPdf={() => equiposPdf.mutate()}
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
            onExcel={() => licenciasExcel.mutate()}
            onPdf={() => licenciasPdf.mutate()}
            cargandoExcel={licenciasExcel.isPending}
            cargandoPdf={licenciasPdf.isPending}
          />
        </div>

        {/* No existe una fecha de vencimiento real en el esquema — solo
            fecha_actualizacion (cuándo cambió la contraseña). "Por
            vencer" se cubre con lo que sí hay: estado actual y el
            listado de las que ya están Vencida o Suspendida. */}
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
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-700">Responsables con más equipos</h2>
          <BotonesExportar
            onExcel={() => responsablesExcel.mutate()}
            onPdf={() => responsablesPdf.mutate()}
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