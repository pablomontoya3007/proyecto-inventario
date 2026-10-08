const TONOS = {
    exito: 'border-sena/30 bg-sena-soft text-sena-dark',
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
 * Resultado de una importación desde Excel, en cuatro grupos:
 * importados, ya registrados (no es error), repetidos en el archivo
 * (no es error) y con errores (una fila por línea, con todo lo que hay
 * que corregir). Lo usan Equipos y Licencias.
 *
 * resultado: { importados, ya_registrados[], repetidos_en_archivo[], con_errores[] }
 * etiquetas: textos propios de cada módulo.
 */
export function ResumenImportacion({ resultado, etiquetas }) {
    const yaRegistrados = resultado.ya_registrados ?? [];
    const repetidos = resultado.repetidos_en_archivo ?? [];
    const conErrores = resultado.con_errores ?? [];

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <Contador etiqueta={etiquetas.importados} valor={resultado.importados ?? 0} tono="exito" />
                <Contador etiqueta={etiquetas.yaRegistrados} valor={yaRegistrados.length} tono="neutro" />
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

            <ListaPlegable titulo={etiquetas.listaYaRegistrados} filas={yaRegistrados} />
            <ListaPlegable titulo="Ver filas repetidas en el archivo (se importó solo la primera)" filas={repetidos} />

            {conErrores.length === 0 && (
                <p className="text-sm text-slate-500">No hay errores que corregir.</p>
            )}
        </div>
    );
}