import { useState } from 'react';

/**
 * Editor libre de clave/valor para caracteristicas_tecnicas (columna JSON
 * en el backend). A propósito NO hay un formulario fijo por tipo de
 * equipo: EquipoRequest.php valida esto con una lista de "campos
 * esperados por tipo" que vive solo en PHP (CAMPOS_POR_TIPO), sin
 * exponerse por ningún endpoint — duplicarla aquí significaría
 * mantenerla sincronizada a mano en dos lugares. En vez de eso, este
 * editor es genérico, y cuando el backend rechaza con 422 por campos
 * faltantes, ya manda un mensaje en español listando justo cuáles — ese
 * mensaje se muestra tal cual (ver prop `error`), sin que el frontend
 * necesite conocer la regla de antemano.
 *
 * CAMPOS_SUGERIDOS_POR_TIPO de abajo es solo una ayuda de UX (rellena
 * nombres de campo típicos al elegir un tipo conocido) — un espejo best
 * effort de CAMPOS_POR_TIPO en EquipoRequest.php. Si se desincroniza con
 * el backend no rompe nada: la validación real sigue viniendo siempre
 * del servidor.
 */
const CAMPOS_SUGERIDOS_POR_TIPO = {
  'Computador portátil': ['procesador', 'ram_gb', 'almacenamiento', 'sistema_operativo', 'marca', 'modelo'],
  'Computador de escritorio': ['procesador', 'ram_gb', 'almacenamiento', 'sistema_operativo', 'marca', 'modelo'],
  'Todo en uno': ['procesador', 'ram_gb', 'almacenamiento', 'sistema_operativo', 'marca', 'modelo'],
  Impresora: ['marca', 'modelo', 'tipo'],
  'Access Point': ['marca', 'modelo'],
  Router: ['marca', 'modelo'],
  Switch: ['marca', 'modelo', 'numero_puertos'],
};

function objetoAFilas(obj) {
  return Object.entries(obj ?? {}).map(([clave, valor]) => ({ clave, valor: String(valor ?? '') }));
}

function filasAObjeto(filas) {
  return Object.fromEntries(
    filas.filter((fila) => fila.clave.trim() !== '').map((fila) => [fila.clave.trim(), fila.valor])
  );
}

/**
 * El padre (EquipoForm) monta este componente con un `key` que cambia
 * según qué equipo se edita (o "nuevo" al crear) — así React lo remonta
 * entero y reinicia sus filas internas, sin necesitar un useEffect para
 * resincronizar cada vez que cambian las props.
 */
export function CaracteristicasEditor({ value, onChange, tipoNombre, error }) {
  const [filas, setFilas] = useState(() => objetoAFilas(value));

  function actualizarFilas(nuevasFilas) {
    setFilas(nuevasFilas);
    onChange(filasAObjeto(nuevasFilas));
  }

  function agregarFila() {
    actualizarFilas([...filas, { clave: '', valor: '' }]);
  }

  function eliminarFila(indice) {
    actualizarFilas(filas.filter((_, i) => i !== indice));
  }

  function actualizarFila(indice, campo, valor) {
    actualizarFilas(filas.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila)));
  }

  function sugerirCampos() {
    const sugeridos = CAMPOS_SUGERIDOS_POR_TIPO[tipoNombre];
    if (!sugeridos) return;

    const clavesActuales = new Set(filas.map((f) => f.clave));
    actualizarFilas([
      ...filas,
      ...sugeridos.filter((clave) => !clavesActuales.has(clave)).map((clave) => ({ clave, valor: '' })),
    ]);
  }

  const haySugerencias = tipoNombre && CAMPOS_SUGERIDOS_POR_TIPO[tipoNombre];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="block text-sm font-medium text-ink">Características técnicas</label>
        {haySugerencias && (
          <button type="button" onClick={sugerirCampos} className="text-xs text-slate-500 hover:underline">
            Sugerir campos para "{tipoNombre}"
          </button>
        )}
      </div>

      <div className="space-y-2">
        {filas.map((fila, indice) => (
          <div key={indice} className="flex gap-2">
            <input
              type="text"
              placeholder="campo"
              value={fila.clave}
              onChange={(event) => actualizarFila(indice, 'clave', event.target.value)}
              className="w-1/3 rounded border border-slate-300 px-2 py-1 text-sm focus:border-sena focus:outline-none"
            />
            <input
              type="text"
              placeholder="valor"
              value={fila.valor}
              onChange={(event) => actualizarFila(indice, 'valor', event.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-sena focus:outline-none"
            />
            <button type="button" onClick={() => eliminarFila(indice)} className="px-2 text-sm text-danger hover:underline">
              Quitar
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={agregarFila} className="mt-2 text-sm text-slate-600 hover:underline">
        + Agregar campo
      </button>

      {/* Mensaje 422 real del backend, ya en español y con los nombres de
          campo que de verdad faltan — no algo calculado en el frontend. */}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
