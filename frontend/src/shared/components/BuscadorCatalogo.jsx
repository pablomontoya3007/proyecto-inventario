import { useId, useState } from 'react';
import { useValorDiferido } from '../hooks/useValorDiferido';

const ESPERA_MS = 300;

/**
 * Autocompletado genérico para catálogos con nombre (sedes, subsedes,
 * ubicaciones). Busca en el servidor mientras se escribe, así que
 * encuentra cualquier registro aunque no esté entre los primeros 15.
 *
 * Props:
 * - useBuscar: hook de búsqueda (useBuscarSedes, useBuscarSubsedes...).
 *   Se llama como useBuscar(termino, { enabled, ...parametros }) y debe
 *   devolver el resultado de useQuery con forma { data: [...], meta }.
 *   Siempre se pasa el MISMO hook en cada render (regla de los hooks).
 * - parametros: opciones extra para el hook (ej. { sedeId }).
 * - value / onChange: componente controlado. value = { id, nombre, ... }
 *   o null; onChange recibe el objeto elegido o null (botón ×).
 * - disabled: deshabilitado (ej. subsede mientras no haya sede).
 * - detalle: función opcional (item) => texto secundario de cada opción.
 *
 * UX (igual que BuscadorResponsable):
 * - Al salir del campo sin elegir, vuelve a mostrar la selección previa.
 * - ↑/↓ recorren, Enter elige (sin enviar el formulario), Esc cierra la
 *   lista (sin cerrar el modal que lo contiene).
 */
export function BuscadorCatalogo({
    id,
    value,
    onChange,
    useBuscar,
    parametros = {},
    disabled = false,
    placeholder = 'Buscar por nombre...',
    detalle,
    className = '',
    inputClassName = '',
}) {
    const [texto, setTexto] = useState('');
    const [abierto, setAbierto] = useState(false);
    const [indiceActivo, setIndiceActivo] = useState(-1);
    const listaId = useId();

    const termino = useValorDiferido(texto.trim(), ESPERA_MS);
    const { data, isFetching, isError } = useBuscar(termino, { enabled: abierto && !disabled, ...parametros });

    const resultados = data?.data ?? [];
    const hayMasResultados = (data?.meta?.last_page ?? 1) > 1;

    function abrir(event) {
        if (disabled) return;
        setTexto(value?.nombre ?? '');
        setIndiceActivo(-1);
        setAbierto(true);
        // Selecciona el texto actual: escribir lo reemplaza de una vez.
        event?.target?.select?.();
    }

    function cerrar() {
        setAbierto(false);
        setIndiceActivo(-1);
    }

    function seleccionar(item) {
        onChange(item);
        setTexto(item.nombre);
        cerrar();
    }

    function limpiar() {
        onChange(null);
        setTexto('');
        cerrar();
    }

    function handleKeyDown(event) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (!abierto) {
                abrir();
                return;
            }
            setIndiceActivo((i) => Math.min(i + 1, resultados.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setIndiceActivo((i) => Math.max(i - 1, 0));
        } else if (event.key === 'Enter' && abierto) {
            // Con la lista abierta, Enter elige una opción — nunca envía el
            // formulario que contiene al buscador.
            event.preventDefault();
            if (indiceActivo >= 0 && resultados[indiceActivo]) {
                seleccionar(resultados[indiceActivo]);
            }
        } else if (event.key === 'Escape' && abierto) {
            // stopPropagation: que Esc cierre solo la lista, no el modal.
            event.preventDefault();
            event.stopPropagation();
            cerrar();
        }
    }

    const textoVisible = abierto ? texto : (value?.nombre ?? '');

    return (
        <div className={`relative ${className}`}>
            <input
                id={id}
                type="text"
                role="combobox"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={abierto}
                aria-controls={listaId}
                aria-activedescendant={abierto && indiceActivo >= 0 ? `${listaId}-${indiceActivo}` : undefined}
                disabled={disabled}
                placeholder={placeholder}
                value={textoVisible}
                onFocus={abrir}
                onBlur={cerrar}
                onChange={(event) => {
                    setTexto(event.target.value);
                    setIndiceActivo(-1);
                    if (!abierto) setAbierto(true);
                }}
                onKeyDown={handleKeyDown}
                className={`w-full pr-8 ${inputClassName}`}
            />

            {value && !disabled && (
                <button
                    type="button"
                    aria-label="Quitar selección"
                    onClick={limpiar}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1 text-lg leading-none text-slate-400 hover:text-danger"
                >
                    ×
                </button>
            )}

            {abierto && (
                <ul
                    id={listaId}
                    role="listbox"
                    className="absolute z-20 mt-1 max-h-60 w-full min-w-56 overflow-y-auto rounded border border-slate-200 bg-white text-sm shadow-lg"
                >
                    {isError && <li className="px-3 py-2 text-danger">No se pudo buscar. Intenta de nuevo.</li>}

                    {!isError && resultados.length === 0 && (
                        <li className="px-3 py-2 text-slate-500">{isFetching ? 'Buscando...' : 'Sin resultados'}</li>
                    )}

                    {resultados.map((item, indice) => (
                        <li
                            key={item.id}
                            id={`${listaId}-${indice}`}
                            role="option"
                            aria-selected={indice === indiceActivo}
                            // preventDefault en mousedown: evita que el input pierda el
                            // foco (y cierre la lista) antes de que llegue el click.
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => seleccionar(item)}
                            onMouseEnter={() => setIndiceActivo(indice)}
                            className={`cursor-pointer px-3 py-2 ${indice === indiceActivo ? 'bg-sena-soft' : ''} ${value?.id === item.id ? 'font-medium' : ''
                                }`}
                        >
                            <span className="block text-ink">{item.nombre}</span>
                            {detalle && detalle(item) && <span className="block text-xs text-slate-500">{detalle(item)}</span>}
                        </li>
                    ))}

                    {hayMasResultados && (
                        <li className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
                            Se muestran los primeros 15. Escribe más para afinar la búsqueda.
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}