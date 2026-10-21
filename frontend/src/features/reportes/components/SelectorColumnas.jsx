/**
 * Botones tipo "chip" para elegir qué columnas lleva el listado del
 * reporte de equipos (en pantalla, Excel y PDF). Ninguno marcado = todas.
 * La placa SENA no aparece aquí porque va siempre.
 *
 * Las claves deben coincidir con ReporteController::COLUMNAS_EQUIPOS.
 */
const COLUMNAS_EQUIPOS = [
    { clave: 'serial', etiqueta: 'Serial' },
    { clave: 'mac', etiqueta: 'MAC inalámbrica (WiFi)' },
    { clave: 'mac_cableada', etiqueta: 'MAC cableada' },
    { clave: 'hostname', etiqueta: 'Hostname' },
    { clave: 'tipo', etiqueta: 'Tipo' },
    { clave: 'estado', etiqueta: 'Estado' },
    { clave: 'cuentadante', etiqueta: 'Cuentadante' },
    { clave: 'ubicacion', etiqueta: 'Ubicación (sede, subsede y ambiente)' },
];

export function SelectorColumnas({ seleccionadas, onChange }) {
    function alternar(clave) {
        onChange(seleccionadas.includes(clave) ? seleccionadas.filter((valor) => valor !== clave) : [...seleccionadas, clave]);
    }

    return (
        <div>
            <div className="mb-1 flex items-baseline gap-3">
                <span className="text-xs font-medium text-slate-600">Columnas del listado</span>
                <span className="text-xs text-slate-400">
                    {seleccionadas.length === 0
                        ? 'Ninguna marcada: salen todas. La placa SENA va siempre.'
                        : 'La placa SENA va siempre.'}
                </span>
                {seleccionadas.length > 0 && (
                    <button type="button" onClick={() => onChange([])} className="text-xs text-slate-500 underline hover:text-ink">
                        Mostrar todas
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {COLUMNAS_EQUIPOS.map((columna) => {
                    const marcada = seleccionadas.includes(columna.clave);

                    return (
                        <button
                            key={columna.clave}
                            type="button"
                            aria-pressed={marcada}
                            onClick={() => alternar(columna.clave)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${marcada
                                    ? 'border-sena bg-sena text-white'
                                    : 'border-slate-300 bg-white text-slate-600 hover:border-sena hover:text-ink'
                                }`}
                        >
                            {marcada && <span aria-hidden="true">✓ </span>}
                            {columna.etiqueta}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}