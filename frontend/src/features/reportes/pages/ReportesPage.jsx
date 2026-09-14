import {
  useReporteEquipos,
  useDescargarReporteEquiposExcel,
  useDescargarReporteEquiposPdf,
} from '../hooks/useReportesEquipos';
import { DesgloseCategoria } from '../components/DesgloseCategoria';

export function ReportesPage() {
  const { data, isLoading, isError } = useReporteEquipos();
  const descargarExcel = useDescargarReporteEquiposExcel();
  const descargarPdf = useDescargarReporteEquiposPdf();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">Reportes</h1>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-700">Equipos por sede, tipo y estado</h2>
          <div className="flex gap-2">
            <button
              onClick={() => descargarExcel.mutate()}
              disabled={descargarExcel.isPending}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {descargarExcel.isPending ? 'Generando...' : 'Descargar Excel'}
            </button>
            <button
              onClick={() => descargarPdf.mutate()}
              disabled={descargarPdf.isPending}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {descargarPdf.isPending ? 'Generando...' : 'Descargar PDF'}
            </button>
          </div>
        </div>

        {isLoading && <p className="text-sm text-slate-500">Cargando reporte...</p>}
        {isError && <p className="text-sm text-red-600">No se pudo cargar el reporte.</p>}

        {data && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <DesgloseCategoria titulo="Por sede" filas={data.por_sede} />
            <DesgloseCategoria titulo="Por tipo de equipo" filas={data.por_tipo} />
            <DesgloseCategoria titulo="Por estado" filas={data.por_estado} etiquetaClave="estado" />
          </div>
        )}
      </section>

      {/* Licencias por vencer, Responsables con más equipos y el resumen
          general quedan pendientes: faltan Responsable.php y
          LicenciaOffice.php para confirmar sus relaciones/campos, y los
          paquetes de Composer para exportar (ya deberías haberlos
          instalado si no lo habías hecho). */}
    </div>
  );
}
