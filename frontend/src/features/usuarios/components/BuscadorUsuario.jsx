import { useEffect, useId, useState } from "react";
import { useBuscarUsuarios } from "../hooks/useUsuarios";

const ESPERA_MS = 300;

function useValorDiferido(valor, espera) {
    const [diferido, setDiferido] = useState(valor);

    useEffect(() => {
        const temporizador = setTimeout(() => setDiferido(valor), espera);
        return () => clearTimeout(temporizador);
    }, [valor, espera]);

    return diferido;
}

/**
 * Autocompletado de usuarios del sistema (nombre o correo), para
 * asignar mantenimientos y novedades. Mismo comportamiento que
 * BuscadorResponsable:
 * - componente controlado: value = { id, nombre, correo } o null;
 * - al salir sin elegir, vuelve a mostrar el usuario ya seleccionado;
 * - × quita la selección; ↑/↓ recorren, Enter elige (sin enviar el
 *   formulario), Esc cierra la lista (sin cerrar el modal).
 */
export function BuscadorUsuario({
    id,
    value,
    onChange,
    placeholder = "Buscar usuario por nombre o correo...",
    className = "",
    inputClassName = "",
}) {
    const [texto, setTexto] = useState("");
    const [abierto, setAbierto] = useState(false);
    const [indiceActivo, setIndiceActivo] = useState(-1);
    const listaId = useId();

    const termino = useValorDiferido(texto.trim(), ESPERA_MS);
    const { data, isFetching, isError } = useBuscarUsuarios(termino, {
        enabled: abierto,
    });

    const resultados = data?.data ?? [];
    const hayMasResultados = (data?.meta?.last_page ?? 1) > 1;

    function abrir(event) {
        setTexto(value?.nombre ?? "");
        setIndiceActivo(-1);
        setAbierto(true);
        event?.target?.select?.();
    }

    function cerrar() {
        setAbierto(false);
        setIndiceActivo(-1);
    }

    function seleccionar(usuario) {
        onChange({
            id: usuario.id,
            nombre: usuario.nombre,
            correo: usuario.correo,
        });
        setTexto(usuario.nombre);
        cerrar();
    }

    function limpiar() {
        onChange(null);
        setTexto("");
        cerrar();
    }

    function handleKeyDown(event) {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!abierto) {
                abrir();
                return;
            }
            setIndiceActivo((i) => Math.min(i + 1, resultados.length - 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setIndiceActivo((i) => Math.max(i - 1, 0));
        } else if (event.key === "Enter" && abierto) {
            event.preventDefault();
            if (indiceActivo >= 0 && resultados[indiceActivo]) {
                seleccionar(resultados[indiceActivo]);
            }
        } else if (event.key === "Escape" && abierto) {
            event.preventDefault();
            event.stopPropagation();
            cerrar();
        }
    }

    const textoVisible = abierto ? texto : (value?.nombre ?? "");

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
                aria-activedescendant={
                    abierto && indiceActivo >= 0
                        ? `${listaId}-${indiceActivo}`
                        : undefined
                }
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

            {value && (
                <button
                    type="button"
                    aria-label="Quitar usuario asignado"
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
                    {isError && (
                        <li className="px-3 py-2 text-danger">
                            No se pudo buscar. Intenta de nuevo.
                        </li>
                    )}

                    {!isError && resultados.length === 0 && (
                        <li className="px-3 py-2 text-slate-500">
                            {isFetching ? "Buscando..." : "Sin resultados"}
                        </li>
                    )}

                    {resultados.map((usuario, indice) => (
                        <li
                            key={usuario.id}
                            id={`${listaId}-${indice}`}
                            role="option"
                            aria-selected={indice === indiceActivo}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => seleccionar(usuario)}
                            onMouseEnter={() => setIndiceActivo(indice)}
                            className={`cursor-pointer px-3 py-2 ${indice === indiceActivo ? "bg-sena-soft" : ""} ${value?.id === usuario.id ? "font-medium" : ""
                                }`}
                        >
                            <span className="block text-ink">{usuario.nombre}</span>
                            <span className="block text-xs text-slate-500">
                                {usuario.correo}
                            </span>
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
