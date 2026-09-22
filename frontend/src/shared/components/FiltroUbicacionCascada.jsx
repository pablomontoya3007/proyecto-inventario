/**
 * Filtro en cascada sede -> subsede -> ubicación, reutilizado por todas
 * las páginas que necesitan acotar sus datos a una parte de la
 * jerarquía. Antes cada página lo tenía copiado (Reportes, Licencias);
 * se extrajo aquí al necesitarse en cuatro secciones más de una vez.
 *
 * `mostrarUbicacion = false` oculta el tercer selector para páginas
 * donde no aplica (por ejemplo, Ubicaciones, que solo puede filtrarse
 * por sede/subsede) — no se usa todavía, pero queda listo para cuando
 * esa página se migre a este mismo componente.
 */
export function FiltroUbicacionCascada({
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
  mostrarUbicacion = true,
}) {
  const hayFiltrosActivos = sedeFiltro || subsedeFiltro || ubicacionFiltro;

  return (
    <div className="mb-4 flex flex-wrap items-end gap-4 rounded border border-slate-200 bg-white p-4">
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

      {mostrarUbicacion && (
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
      )}

      {hayFiltrosActivos && (
        <button onClick={onLimpiar} className="text-sm text-slate-500 underline hover:text-slate-700">
          Limpiar filtros
        </button>
      )}
    </div>
  );
}   