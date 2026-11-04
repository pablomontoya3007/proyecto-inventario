import { BuscadorCatalogoPorId } from './BuscadorCatalogo';
import { useBuscarSedes, useSedePorId } from '../../features/sedes/hooks/useSedes';
import { useBuscarSubsedes, useSubsedePorId } from '../../features/subsedes/hooks/useSubsedes';
import { useBuscarUbicaciones, useUbicacionPorId } from '../../features/ubicaciones/hooks/useUbicaciones';

const CAMPO =
  'rounded border border-slate-300 px-2 py-1 text-sm focus:border-sena focus:outline-none focus:ring-1 focus:ring-sena disabled:bg-surface';

/**
 * Filtro en cascada sede -> subsede -> ubicación, reutilizado por todas
 * las páginas que necesitan acotar sus datos a una parte de la
 * jerarquía (Equipos, Licencias, Responsables, Mantenimientos,
 * Traslados, Observaciones, Novedades, Reportes).
 *
 * Cada nivel es un buscador (BuscadorCatalogoPorId): se escribe parte del
 * nombre y el servidor devuelve las coincidencias, así que ya no hay
 * límite de 15 registros. El componente es autónomo: las páginas solo
 * guardan los ids (texto, '' = sin filtro) y reciben los cambios por
 * onSedeChange / onSubsedeChange / onUbicacionChange(id).
 *
 * `mostrarUbicacion = false` oculta el tercer buscador para páginas
 * donde no aplica (por ejemplo, la propia lista de Ubicaciones, que
 * solo puede filtrarse por sede/subsede).
 */
export function FiltroUbicacionCascada({
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
      <div className="w-52">
        <label htmlFor="filtro-sede" className="mb-1 block text-xs font-medium text-slate-600">
          Sede
        </label>
        <BuscadorCatalogoPorId
          id="filtro-sede"
          valueId={sedeFiltro}
          onChange={onSedeChange}
          usePorId={useSedePorId}
          useBuscar={useBuscarSedes}
          placeholder="Todas las sedes"
          inputClassName={CAMPO}
        />
      </div>

      <div className="w-52">
        <label htmlFor="filtro-subsede" className="mb-1 block text-xs font-medium text-slate-600">
          Subsede
        </label>
        <BuscadorCatalogoPorId
          id="filtro-subsede"
          valueId={subsedeFiltro}
          onChange={onSubsedeChange}
          usePorId={useSubsedePorId}
          useBuscar={useBuscarSubsedes}
          parametros={{ sedeId: sedeFiltro || undefined }}
          disabled={!sedeFiltro}
          placeholder="Todas las subsedes"
          inputClassName={CAMPO}
        />
      </div>

      {mostrarUbicacion && (
        <div className="w-52">
          <label htmlFor="filtro-ubicacion" className="mb-1 block text-xs font-medium text-slate-600">
            Ubicación
          </label>
          <BuscadorCatalogoPorId
            id="filtro-ubicacion"
            valueId={ubicacionFiltro}
            onChange={onUbicacionChange}
            usePorId={useUbicacionPorId}
            useBuscar={useBuscarUbicaciones}
            parametros={{ subsedeId: subsedeFiltro || undefined }}
            disabled={!subsedeFiltro}
            placeholder="Todas las ubicaciones"
            inputClassName={CAMPO}
          />
        </div>
      )}

      {hayFiltrosActivos && (
        <button type="button" onClick={onLimpiar} className="text-sm text-slate-500 underline hover:text-ink">
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
