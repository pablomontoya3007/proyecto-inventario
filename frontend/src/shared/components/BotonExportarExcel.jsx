import { useState } from 'react';
import httpClient from '../../api/httpClient';
import { descargarBlob, mensajeDeErrorDescarga } from '../utils/descargarArchivo';

/**
 * Botón "Exportar Excel" de los listados (Licencias, Mantenimientos,
 * Novedades, Traslados, Observaciones, Usuarios). Descarga TODO lo que
 * cumple los filtros activos — no solo la página que se ve — porque
 * manda al backend el mismo objeto `filtros` que usa el listado.
 *
 * url: endpoint de exportación, p. ej. `${ENDPOINTS.novedades}/exportar`
 * nombreBase: nombre del archivo sin extensión; se le agrega la fecha.
 * filtros: los mismos filtros del listado (sin `page`).
 * hayFiltros: opcional; por defecto, si `filtros` trae algo. Útil cuando
 *   se manda un parámetro que no es un filtro elegido (p. ej. la pestaña).
 */
export function BotonExportarExcel({ url, nombreBase, filtros = {}, hayFiltros: hayFiltrosProp }) {
    const [descargando, setDescargando] = useState(false);
    const [error, setError] = useState(null);

    async function handleExportar() {
        setError(null);
        setDescargando(true);

        try {
            const hoy = new Date().toLocaleDateString('en-CA'); // AAAA-MM-DD en hora local
            await descargarBlob(httpClient, url, `${nombreBase}-${hoy}.xlsx`, filtros);
        } catch (errorDescarga) {
            setError(await mensajeDeErrorDescarga(errorDescarga, 'No se pudo exportar'));
        } finally {
            setDescargando(false);
        }
    }

    const hayFiltros = hayFiltrosProp ?? Object.keys(filtros).length > 0;

    return (
        <div className="flex flex-col items-end">
            <button
                type="button"
                onClick={handleExportar}
                disabled={descargando}
                title={hayFiltros ? 'Exporta todo lo que cumple los filtros puestos' : 'Exporta todos los registros'}
                className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-surface disabled:opacity-50"
            >
                {descargando ? 'Exportando...' : hayFiltros ? 'Exportar Excel (filtrado)' : 'Exportar Excel'}
            </button>
            {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
    );
}