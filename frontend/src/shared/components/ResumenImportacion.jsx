const TONOS = {
    exito: 'border-sena/30 bg-sena-soft text-sena-dark',
    info: 'border-info/30 bg-blue-50 text-info',
    neutro: 'border-slate-200 bg-surface text-slate-700',
    error: 'border-danger/30 bg-danger/10 text-danger',
};

function Contador({ etiqueta, valor, tono }) {
    return (
        <div className={`rounded border px-3 py-2 ${TONOS[tono]}`}>
            <p className="font-mono text-2xl font-bold">{valor}</p>
            <p className="text-xs">{etiqueta}</p>
        </div>
    );
}

/**
 * Lista plegable (<details>) para los grupos informativos: no son
 * errores, así que no se despliegan solos y no ocupan la pantalla.
 */
function ListaPlegable({ titulo, filas }) {
    if (filas.length === 0) return null;

    return (
        <details className="rounded border border-slate-200 bg-white">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700 hover:bg-surface">
                {titulo} ({filas.length})
            </summary>
            <ul className="max-h-48 space-y-1 overflow-y-auto border-t border-slate-100 px-3 py-2 text-sm">
                {filas.map((fila) => (
                    <li key={fila.fila} className="text-slate-600">
                        <span className="font-mono text-slate-400">Fila {fila.fila}</span>
                        {' · '}
                        <span className="font-mono text-ink">{fila.placa_sena ?? '(sin placa)'}</span>
                        {' — '}
                        {fila.motivo}
                    </li>
                ))}
            </ul>
        </details>
    );
}

/**
 * Detalle de lo que se actualizó: una entrada por fila con cada campo
 * que cambió ("Hostname: "PC-1" → "PC-2""). Se muestra abierta porque
 * es justo lo que la persona quiere revisar después de una carga masiva.
 */
function ListaActualizados({ filas }) {
    if (filas.length === 0) return null;

    return (
        <details open className="rounded border border-info/30 bg-white">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-info hover:bg-blue-50">
                Ver qué cambió en cada registro actualizado ({filas.length})
            </summary>
            <ul className="max-h-64 space-y-2 overflow-y-auto border-t border-slate-100 px-3 py-2 text-sm">
                {filas.map((fila) => (
                    <li key={fila.fila}>
                        <p className="text-slate-600">
                            <span className="font-mono text-slate-400">Fila {fila.fila}</span>
                            {' · '}
                            <span className="font-mono text-ink">{fila.placa_sena}</span>
                        </p>
                        <ul className="ml-4 list-inside list-disc text-slate-600">
                            {fila.cambios.map((cambio) => (
                                <li key={cambio}>{cambio}</li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </details>
    );
}

/**
 * Resultado de una importación desde Excel, en cinco grupos:
 * nuevos, actualizados (con el detalle de cada cambio), sin cambios,
 * repetidos en el archivo y con errores. Lo usan Equipos y Licencias.
 *
 * resultado: { importados, actualizados[], sin_cambios[], repetidos_en_archivo[], con_errores[] }
 * etiquetas: textos propios de cada módulo.
 */
export function ResumenImportacion({ resultado, etiquetas }) {
    const actualizados = resultado.actualizados ?? [];
    const sinCambios = resultado.sin_cambios ?? [];
    const repetidos = resultado.repetidos_en_archivo ?? [];
    const conErrores = resultado.con_errores ?? [];

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                <Contador etiqueta={etiquetas.importados} valor={resultado.importados ?? 0} tono="exito" />
                <Contador etiqueta={etiquetas.actualizados} valor={actualizados.length} tono={actualizados.length > 0 ? 'info' : 'neutro'} />
                <Contador etiqueta="Sin cambios" valor={sinCambios.length} tono="neutro" />
                <Contador etiqueta="Repetidos en el archivo" valor={repetidos.length} tono="neutro" />
                <Contador etiqueta="Con errores" valor={conErrores.length} tono={conErrores.length > 0 ? 'error' : 'neutro'} />
            </div>

            {conErrores.length > 0 && (
                <div className="rounded border border-danger/30">
                    <p className="border-b border-danger/20 bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
                        Filas para corregir en el Excel
                    </p>
                    <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-white">
                                <tr className="border-b border-slate-200 text-slate-500">
                                    <th className="px-3 py-2 font-medium">Fila</th>
                                    <th className="px-3 py-2 font-medium">Placa SENA</th>
                                    <th className="px-3 py-2 font-medium">Qué revisar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {conErrores.map((fila) => (
                                    <tr key={fila.fila} className="border-b border-slate-100 align-top">
                                        <td className="px-3 py-2 font-mono text-slate-500">{fila.fila}</td>
                                        <td className="px-3 py-2 font-mono text-ink">{fila.placa_sena ?? '—'}</td>
                                        <td className="px-3 py-2 text-slate-600">
                                            <ul className="list-inside list-disc space-y-0.5">
                                                {fila.errores.map((error) => (
                                                    <li key={error}>{error}</li>
                                                ))}
                                            </ul>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <ListaActualizados filas={actualizados} />
            <ListaPlegable titulo={etiquetas.listaSinCambios} filas={sinCambios} />
            <ListaPlegable titulo="Ver filas repetidas en el archivo (se procesó solo la primera)" filas={repetidos} />

            {conErrores.length === 0 && (
                <p className="text-sm text-slate-500">No hay errores que corregir.</p>
            )}
        </div>
    );
}