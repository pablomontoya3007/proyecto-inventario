import { EstadoBadge } from '../../../shared/components/EstadoBadge';

const ESTADO_CRUDO_POR_ETIQUETA = {
  Activa: 'activa',
  Vencida: 'vencida',
  Suspendida: 'suspendida',
};

export function LicenciasListadoTabla({ filas }) {
  if (filas.length === 0) {
    return <p className="text-sm text-slate-400">No hay licencias para este filtro.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-slate-500">
          <th className="py-2 pr-4 font-medium">Equipo</th>
          <th className="py-2 pr-4 font-medium">Sede</th>
          <th className="py-2 pr-4 font-medium">Subsede</th>
          <th className="py-2 pr-4 font-medium">Ubicación</th>
          <th className="py-2 pr-4 font-medium">Correo</th>
          <th className="py-2 pr-4 font-medium">Estado</th>
          <th className="py-2 pr-4 font-medium">Última actualización</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((fila, indice) => (
          <tr key={indice} className="border-b border-slate-100">
            <td className="py-2 pr-4 font-mono text-ink">{fila.equipo}</td>
            <td className="py-2 pr-4 text-slate-500">{fila.sede}</td>
            <td className="py-2 pr-4 text-slate-500">{fila.subsede}</td>
            <td className="py-2 pr-4 text-slate-500">{fila.ubicacion}</td>
            <td className="py-2 pr-4 text-slate-500">{fila.correo}</td>
            <td className="py-2 pr-4">
              <EstadoBadge estado={ESTADO_CRUDO_POR_ETIQUETA[fila.estado] ?? null} label={fila.estado} />
            </td>
            <td className="py-2 pr-4 font-mono text-slate-500">{fila.fecha_actualizacion ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
