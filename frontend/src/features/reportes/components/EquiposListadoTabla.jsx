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

export function EquiposListadoTabla({ filas }) {
  if (filas.length === 0) {
    return <p className="text-sm text-slate-400">No hay equipos para este filtro.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-slate-500">
          <th className="py-2 pr-4 font-medium">Placa SENA</th>
          <th className="py-2 pr-4 font-medium">Tipo</th>
          <th className="py-2 pr-4 font-medium">Sede</th>
          <th className="py-2 pr-4 font-medium">Subsede</th>
          <th className="py-2 pr-4 font-medium">Ambiente</th>
          <th className="py-2 pr-4 font-medium">Estado</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((fila, indice) => (
          <tr key={indice} className="border-b border-slate-100">
            <td className="py-2 pr-4 font-mono text-ink">{fila.placa_sena}</td>
            <td className="py-2 pr-4 text-slate-500">{fila.tipo}</td>
            <td className="py-2 pr-4 text-slate-500">{fila.sede}</td>
            <td className="py-2 pr-4 text-slate-500">{fila.subsede}</td>
            <td className="py-2 pr-4 text-slate-500">{fila.ambiente}</td>
            <td className="py-2 pr-4">
              <EstadoBadge estado={ESTADO_CRUDO_POR_ETIQUETA[fila.estado] ?? null} label={fila.estado} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
