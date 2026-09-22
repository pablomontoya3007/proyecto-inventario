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

// Mismo patrón "en cascada, el más específico manda" que ya usan
// EquiposPage y UbicacionesPage: elegir una ubicación implica su subsede
// y su sede, así que solo se manda el id más específico al backend. Se
// extrae aquí mismo (no a shared/) por la misma razón que BotonesExportar:
// es propio de esta página.
function FiltrosUbicacion({
  sedesData,
  subsedesData,
  ubicacionesData,
  sedeFiltro,
  subsedeFiltro,
  ubicacionFiltro,
  onSedeChange,
  onSubsedeChange,
  onUbicacionChange,
  onLimpiar,
}) {
  const hayFiltrosActivos = sedeFiltro || subsedeFiltro || ubicacionFiltro;

  return (
    <div className="mb-6 flex flex-wrap items-end gap-4 rounded border border-slate-200 bg-white p-4">
      <div>
        <label htmlFor="filtro-sede" className="mb-1 block text-sm text-slate-600">
          Sede
        </label>
        <select
          id="filtro-sede"
          value={sedeFiltro}
          onChange={(event) => onSedeChange(event.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
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
        <label htmlFor="filtro-subsede" className="mb-1 block text-sm text-slate-600">
          Subsede
        </label>
        <select
          id="filtro-subsede"
          value={subsedeFiltro}
          disabled={!sedeFiltro}
          onChange={(event) => onSubsedeChange(event.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-100"
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
        <label htmlFor="filtro-ubicacion" className="mb-1 block text-sm text-slate-600">
          Ubicación
        </label>
        <select
          id="filtro-ubicacion"
          value={ubicacionFiltro}
          disabled={!subsedeFiltro}
          onChange={(event) => onUbicacionChange(event.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-100"
        >
          <option value="">Todas las ubicaciones</option>
          {ubicacionesData?.data.map((ubicacion) => (
            <option key={ubicacion.id} value={ubicacion.id}>
              {ubicacion.nombre}
            </option>
          ))}
        </select>
      </div>

      {hayFiltrosActivos && (
        <button onClick={onLimpiar} className="text-sm text-slate-500 underline hover:text-slate-700">
          Limpiar filtros
        </button>
      )}
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

  // ubicacion_formacion_id ya implica subsede/sede, así que si está
  // elegida se manda solo ella — mismo criterio que EquiposPage.
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

      <FiltrosUbicacion
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