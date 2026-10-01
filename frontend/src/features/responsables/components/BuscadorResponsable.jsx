import { useEffect, useId, useState } from 'react';
import { useBuscarResponsables } from '../hooks/useResponsables';

const ESPERA_MS = 300;

/**
 * Devuelve `valor` con retraso: solo se actualiza cuando deja de cambiar
 * durante `espera` ms. Así la búsqueda no se lanza en cada tecla.
 */
function useValorDiferido(valor, espera) {
  const [diferido, setDiferido] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setDiferido(valor), espera);
    return () => clearTimeout(temporizador);
  }, [valor, espera]);

  return diferido;
}

/**
 * Autocompletado de responsables contra el backend (parámetro "buscar":
 * nombre o documento). Pensado para cuando hay demasiados responsables
 * para un <select>: solo viajan los 15 que coinciden con lo escrito.
 *
 * Es un componente controlado: `value` es el objeto responsable
 * seleccionado (o null) y `onChange` recibe el nuevo objeto (o null).
 *
 * Reglas de UX:
 * - Al salir del campo sin elegir, se vuelve a mostrar el responsable
 *   que ya estaba seleccionado — nunca queda un texto suelto que
 *   parezca seleccionado sin estarlo.
 * - El botón × quita la selección (equipo sin asignar / sin filtro).
 * - Teclado: ↑/↓ recorren, Enter elige (sin enviar el formulario),
 *   Esc cierra la lista (sin cerrar el modal que lo contenga).
 */
export function BuscadorResponsable({
  id,
  value,
  onChange,
  placeholder = 'Buscar por nombre o documento...',
  className = '',
  inputClassName = '',
}) {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(-1);
  const listaId = useId();

  const termino = useValorDiferido(texto.trim(), ESPERA_MS);
  const { data, isFetching, isError } = useBuscarResponsables(termino, { enabled: abierto });

  const resultados = data?.data ?? [];
  const hayMasResultados = (data?.meta?.last_page ?? 1) > 1;

  function abrir(event) {
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

  function seleccionar(responsable) {
    onChange(responsable);
    setTexto(responsable.nombre);
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
          aria-label="Quitar responsable seleccionado"
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

          {resultados.map((responsable, indice) => (
            <li
              key={responsable.id}
              id={`${listaId}-${indice}`}
              role="option"
              aria-selected={indice === indiceActivo}
              // preventDefault en mousedown: evita que el input pierda el
              // foco (y cierre la lista) antes de que llegue el click.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => seleccionar(responsable)}
              onMouseEnter={() => setIndiceActivo(indice)}
              className={`cursor-pointer px-3 py-2 ${indice === indiceActivo ? 'bg-sena-soft' : ''} ${
                value?.id === responsable.id ? 'font-medium' : ''
              }`}
            >
              <span className="block text-ink">{responsable.nombre}</span>
              {responsable.documento && (
                <span className="block text-xs text-slate-500">{responsable.documento}</span>
              )}
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