import { useEffect, useRef, useState } from 'react';

/**
 * Lista desplegable con casillas para elegir UNO O VARIOS tipos de
 * equipo. Ninguno marcado = todos los tipos (igual que la opción "Todos
 * los tipos" del select que reemplaza).
 *
 * Se cierra al hacer clic fuera o con Escape. Los ids se manejan como
 * texto, igual que los demás filtros de la página (vienen de <select>).
 *
 * tipos: [{ id, nombre }]
 * seleccionados: string[] (ids)
 * onChange: (string[]) => void
 */
export function SelectorTiposEquipo({ tipos = [], seleccionados, onChange }) {
    const [abierto, setAbierto] = useState(false);
    const contenedorRef = useRef(null);

    useEffect(() => {
        if (!abierto) return undefined;

        function handleClickFuera(event) {
            if (contenedorRef.current && !contenedorRef.current.contains(event.target)) {
                setAbierto(false);
            }
        }

        function handleTecla(event) {
            if (event.key === 'Escape') setAbierto(false);
        }

        document.addEventListener('mousedown', handleClickFuera);
        document.addEventListener('keydown', handleTecla);

        return () => {
            document.removeEventListener('mousedown', handleClickFuera);
            document.removeEventListener('keydown', handleTecla);
        };
    }, [abierto]);

    function alternar(id) {
        const clave = String(id);
        onChange(seleccionados.includes(clave) ? seleccionados.filter((valor) => valor !== clave) : [...seleccionados, clave]);
    }

    const resumen =
        seleccionados.length === 0
            ? 'Todos los tipos'
            : seleccionados.length === 1
                ? (tipos.find((tipo) => String(tipo.id) === seleccionados[0])?.nombre ?? '1 tipo')
                : `${seleccionados.length} tipos seleccionados`;

    return (
        <div ref={contenedorRef} className="relative">
            <button
                type="button"
                aria-haspopup="true"
                aria-expanded={abierto}
                onClick={() => setAbierto((valor) => !valor)}
                className={`flex min-w-48 items-center justify-between gap-2 rounded border px-2 py-1 text-left text-sm focus:border-sena focus:outline-none focus:ring-1 focus:ring-sena ${seleccionados.length > 0 ? 'border-sena text-ink' : 'border-slate-300 text-slate-700'
                    }`}
            >
                <span className="truncate">{resumen}</span>
                <span aria-hidden="true" className="text-xs text-slate-400">
                    {abierto ? '▲' : '▼'}
                </span>
            </button>

            {abierto && (
                <div className="absolute z-20 mt-1 w-64 rounded border border-slate-200 bg-white shadow-lg">
                    <div className="flex justify-between border-b border-slate-100 px-3 py-1.5 text-xs">
                        <button
                            type="button"
                            onClick={() => onChange(tipos.map((tipo) => String(tipo.id)))}
                            className="text-sena hover:underline"
                        >
                            Marcar todos
                        </button>
                        <button
                            type="button"
                            onClick={() => onChange([])}
                            disabled={seleccionados.length === 0}
                            className="text-slate-500 hover:underline disabled:opacity-40"
                        >
                            Limpiar
                        </button>
                    </div>

                    <ul className="max-h-60 overflow-y-auto py-1">
                        {tipos.map((tipo) => {
                            const marcado = seleccionados.includes(String(tipo.id));

                            return (
                                <li key={tipo.id}>
                                    <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-ink hover:bg-surface">
                                        <input
                                            type="checkbox"
                                            checked={marcado}
                                            onChange={() => alternar(tipo.id)}
                                            className="accent-sena"
                                        />
                                        {tipo.nombre}
                                    </label>
                                </li>
                            );
                        })}
                        {tipos.length === 0 && <li className="px-3 py-1.5 text-sm text-slate-400">No hay tipos registrados.</li>}
                    </ul>
                </div>
            )}
        </div>
    );
}