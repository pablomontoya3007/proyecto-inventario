import { useState, useEffect, useRef } from 'react';
import { fetchEquipos } from '../../features/equipos/services/equiposApi';

const MIN_CARACTERES = 2;
const ESPERA_MS = 300;

/**
 * Buscador de equipo por placa SENA. Reemplaza los <select> que solo
 * cargaban la página 1 de equipos (15): con más equipos que eso, el resto
 * no se podía elegir. Este busca en el servidor mientras se escribe,
 * reutilizando fetchEquipos({ placa_sena }) — el mismo filtro de la
 * tabla de Equipos — en vez de inventar un endpoint nuevo.
 *
 * Pensado para escribir rápido:
 * - Basta con escribir parte de la placa (también solo los números).
 * - Si lo escrito coincide EXACTAMENTE con una placa, el equipo queda
 *   elegido solo, sin tener que hacer clic en la lista.
 * - Flechas arriba/abajo para recorrer la lista, Enter para elegir,
 *   Escape para cerrarla (sin cerrar el modal que lo contiene).
 *
 * `value` es el equipo elegido (objeto con id y placa_sena) o null, y
 * `onChange` recibe ese mismo objeto — o null si la persona vuelve a
 * editar el texto, porque entonces la selección anterior ya no vale.
 */
export function EquipoAutocomplete({ value, onChange, id = 'equipo-autocomplete' }) {
  const [texto, setTexto] = useState(value?.placa_sena ?? '');
  const [resultados, setResultados] = useState([]);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(0);
  const contenedorRef = useRef(null);

  // onChange puede llegar como una función nueva en cada render del
  // padre; se guarda en una ref para que el efecto de búsqueda no se
  // reinicie por eso.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const busqueda = texto.trim();

    if (busqueda.length < MIN_CARACTERES || (value && texto === value.placa_sena)) {
      setResultados([]);
      setBuscando(false);
      return;
    }

    // "cancelado" evita que una respuesta lenta de una búsqueda vieja
    // pise los resultados de una más reciente.
    let cancelado = false;
    setBuscando(true);
    setErrorBusqueda(false);

    const timeoutId = setTimeout(async () => {
      try {
        const data = await fetchEquipos({ placa_sena: busqueda }, 1);
        if (cancelado) return;

        const exacto = data.data.find((equipo) => equipo.placa_sena.toLowerCase() === busqueda.toLowerCase());
        if (exacto) {
          onChangeRef.current(exacto);
          setTexto(exacto.placa_sena);
          setResultados([]);
          setMostrarLista(false);
          return;
        }

        setResultados(data.data);
        setIndiceActivo(0);
        setMostrarLista(true);
      } catch {
        if (!cancelado) {
          setResultados([]);
          setErrorBusqueda(true);
        }
      } finally {
        if (!cancelado) setBuscando(false);
      }
    }, ESPERA_MS);

    return () => {
      cancelado = true;
      clearTimeout(timeoutId);
    };
  }, [texto, value]);

  useEffect(() => {
    function cerrarSiClicAfuera(event) {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target)) {
        setMostrarLista(false);
      }
    }
    document.addEventListener('mousedown', cerrarSiClicAfuera);
    return () => document.removeEventListener('mousedown', cerrarSiClicAfuera);
  }, []);

  function seleccionar(equipo) {
    onChange(equipo);
    setTexto(equipo.placa_sena);
    setResultados([]);
    setMostrarLista(false);
  }

  function manejarTeclas(event) {
    const listaAbierta = mostrarLista && resultados.length > 0;
    if (!listaAbierta) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIndiceActivo((indice) => (indice + 1) % resultados.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIndiceActivo((indice) => (indice - 1 + resultados.length) % resultados.length);
    } else if (event.key === 'Enter') {
      // Con la lista abierta, Enter elige el resaltado en vez de enviar el formulario.
      event.preventDefault();
      seleccionar(resultados[indiceActivo]);
    } else if (event.key === 'Escape') {
      // El Modal cierra con Escape a nivel de documento; aquí se corta
      // la propagación para que Escape solo cierre la lista.
      event.stopPropagation();
      setMostrarLista(false);
    }
  }

  const listaAbierta = mostrarLista && resultados.length > 0;

  return (
    <div ref={contenedorRef} className="relative">
      <input
        id={id}
        type="text"
        required
        autoComplete="off"
        role="combobox"
        aria-expanded={listaAbierta}
        aria-controls={`${id}-lista`}
        placeholder="Escribe la placa SENA..."
        value={texto}
        onChange={(event) => {
          setTexto(event.target.value);
          if (value) onChange(null); // si edita el texto, invalida la selección previa
        }}
        onKeyDown={manejarTeclas}
        onFocus={() => resultados.length > 0 && setMostrarLista(true)}
        className="w-full rounded border border-slate-300 px-3 py-2 font-mono focus:border-sena focus:outline-none focus:ring-1 focus:ring-sena"
      />

      {buscando && <p className="mt-1 text-xs text-slate-400">Buscando...</p>}
      {errorBusqueda && <p className="mt-1 text-xs text-danger">No se pudo buscar equipos. Intenta de nuevo.</p>}
      {value && !buscando && (
        <p className="mt-1 text-xs text-sena-dark">✓ {value.tipo_equipo?.nombre ?? 'Equipo'} seleccionado</p>
      )}

      {listaAbierta && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded border border-slate-200 bg-white shadow-lg"
        >
          {resultados.map((equipo, indice) => (
            <li
              key={equipo.id}
              role="option"
              aria-selected={indice === indiceActivo}
              // mousedown (no click) para elegir antes de que el input pierda el foco.
              onMouseDown={(event) => {
                event.preventDefault();
                seleccionar(equipo);
              }}
              onMouseEnter={() => setIndiceActivo(indice)}
              className={`cursor-pointer px-3 py-2 text-sm ${indice === indiceActivo ? 'bg-sena-soft' : ''}`}
            >
              <span className="font-mono font-medium text-ink">{equipo.placa_sena}</span>
              {equipo.tipo_equipo?.nombre && <span className="text-slate-400"> — {equipo.tipo_equipo.nombre}</span>}
              {equipo.ubicacion_formacion?.nombre && (
                <span className="text-slate-400"> · {equipo.ubicacion_formacion.nombre}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {mostrarLista && !buscando && !errorBusqueda && !value && texto.trim().length >= MIN_CARACTERES && resultados.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded border border-slate-200 bg-white p-3 text-sm text-slate-400 shadow-lg">
          No se encontraron equipos con esa placa.
        </div>
      )}
    </div>
  );
}