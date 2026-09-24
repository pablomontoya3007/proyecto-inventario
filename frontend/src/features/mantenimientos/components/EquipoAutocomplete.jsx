import { useState, useEffect, useRef } from 'react';
import { fetchEquipos } from '../../equipos/services/equiposApi';

/**
 * No es un <select> como en el resto del proyecto: con potencialmente
 * cientos de equipos, cargar todos de antemano no escala (ya veníamos
 * arrastrando el límite de "solo página 1, máx. 15" en varios selects
 * del proyecto). Este busca en el servidor mientras se escribe,
 * reutilizando fetchEquipos({ placa_sena }) — el mismo filtro que ya
 * usa la tabla de Equipos — en vez de inventar un endpoint nuevo.
 */
export function EquipoAutocomplete({ value, onChange }) {
  const [texto, setTexto] = useState(value?.placa_sena ?? '');
  const [resultados, setResultados] = useState([]);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    if (texto.trim().length < 2 || (value && texto === value.placa_sena)) {
      setResultados([]);
      return;
    }

    setBuscando(true);
    // Debounce simple: espera una pausa de 300ms sin escribir antes de
    // buscar, para no disparar una petición por cada tecla.
    const timeoutId = setTimeout(async () => {
      try {
        const data = await fetchEquipos({ placa_sena: texto }, 1);
        setResultados(data.data);
        setMostrarLista(true);
      } finally {
        setBuscando(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
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
    setMostrarLista(false);
  }

  return (
    <div ref={contenedorRef} className="relative">
      <input
        type="text"
        required
        placeholder="Escribe la placa SENA..."
        value={texto}
        onChange={(event) => {
          setTexto(event.target.value);
          if (value) onChange(null); // si edita el texto, invalida la selección previa
        }}
        onFocus={() => resultados.length > 0 && setMostrarLista(true)}
        className="w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
      />

      {buscando && <p className="mt-1 text-xs text-slate-400">Buscando...</p>}

      {mostrarLista && resultados.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded border border-slate-200 bg-white shadow-lg">
          {resultados.map((equipo) => (
            <li key={equipo.id}>
              <button
                type="button"
                onClick={() => seleccionar(equipo)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className="font-medium text-ink">{equipo.placa_sena}</span>
                {equipo.tipo_equipo?.nombre && (
                  <span className="text-slate-400"> — {equipo.tipo_equipo.nombre}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {mostrarLista && !buscando && texto.trim().length >= 2 && resultados.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded border border-slate-200 bg-white p-3 text-sm text-slate-400 shadow-lg">
          No se encontraron equipos con esa placa.
        </div>
      )}
    </div>
  );
}
