import { EstadoBadge } from '../../../shared/components/EstadoBadge';

// El backend manda la etiqueta ya traducida (fila.estado, ej. "En
// mantenimiento"), no el valor crudo del enum — se traduce de vuelta
// aquí solo para elegir el color correcto en EstadoBadge.
const ESTADO_CRUDO_POR_ETIQUETA = {
  Activo: 'activo',
  'En mantenimiento': 'mantenimiento',
  'De baja': 'de_baja',
  Extraviado: 'extraviado',
};

// Identificadores: letra monoespaciada y sin partirse en dos líneas.
const COLUMNAS_MONO = new Set(['placa_sena', 'serial', 'mac', 'mac_cableada']);

/**
 * Listado del reporte de equipos con las columnas que eligió la persona.
 * columnas: [{ clave, etiqueta }] — vienen del backend, en el mismo
 * orden que las claves de cada fila (y que el Excel y el PDF).
 */
export function EquiposListadoTabla({ columnas = [], filas }) {
  if (filas.length === 0) {
    return <p className="text-sm text-slate-400">No hay equipos para este filtro.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="sticky top-0 bg-white">
        <tr className="border-b border-slate-200 text-slate-500">
          {columnas.map((columna) => (
            <th key={columna.clave} className="whitespace-nowrap py-2 pr-4 font-medium">
              {columna.etiqueta}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filas.map((fila) => (
          <tr key={fila.placa_sena} className="border-b border-slate-100">
            {columnas.map((columna) => (
              <td
                key={columna.clave}
                className={`py-2 pr-4 ${columna.clave === 'placa_sena' ? 'font-mono text-ink' : 'text-slate-500'} ${
                  COLUMNAS_MONO.has(columna.clave) ? 'whitespace-nowrap' : ''
                } ${COLUMNAS_MONO.has(columna.clave) && columna.clave !== 'placa_sena' ? 'font-mono text-xs' : ''}`}
              >
                {columna.clave === 'estado' ? (
                  <EstadoBadge estado={ESTADO_CRUDO_POR_ETIQUETA[fila.estado] ?? null} label={fila.estado} />
                ) : (
                  fila[columna.clave]
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}