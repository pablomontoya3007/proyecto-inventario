const TONOS = {
    neutral: 'text-ink',
    success: 'text-sena-dark',
    warning: 'text-warning',
    danger: 'text-danger',
    info: 'text-info',
};

/**
 * Fila de contadores en la parte superior de un módulo.
 *
 * contadores: [{ clave, etiqueta, valor, tono?, activo?, onClick? }]
 * - Con onClick, el contador es un botón (normalmente aplica o quita un
 *   filtro de la página); "activo" lo resalta como filtro aplicado.
 * - Los valores son totales de TODO el sistema (vienen de /dashboard),
 *   no del resultado filtrado de la tabla.
 */
export function ContadoresModulo({ contadores, cargando }) {
    if (cargando) {
        return <div className="mb-4 h-[60px] animate-pulse rounded border border-slate-200 bg-white" />;
    }

    return (
        <div className="mb-4 flex flex-wrap gap-2">
            {contadores.map((contador) => {
                const contenido = (
                    <>
                        <span className={`font-mono text-xl font-bold ${TONOS[contador.tono ?? 'neutral']}`}>
                            {contador.valor ?? 0}
                        </span>
                        <span className="text-xs text-slate-500">{contador.etiqueta}</span>
                    </>
                );

                const clases = `flex min-w-28 flex-col rounded border bg-white px-3 py-2 text-left ${contador.activo ? 'border-sena ring-1 ring-sena' : 'border-slate-200'
                    }`;

                return contador.onClick ? (
                    <button
                        key={contador.clave}
                        type="button"
                        onClick={contador.onClick}
                        aria-pressed={Boolean(contador.activo)}
                        title={contador.activo ? 'Clic para quitar este filtro' : 'Clic para filtrar'}
                        className={`${clases} transition hover:border-sena`}
                    >
                        {contenido}
                    </button>
                ) : (
                    <div key={contador.clave} className={clases}>
                        {contenido}
                    </div>
                );
            })}
        </div>
    );
}