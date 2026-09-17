// Sin columna de Acciones: los traslados no se editan ni se borran
// (mismo motivo que Observaciones) — es una lista de solo lectura.
export function TrasladoTable({ traslados }) {
  if (traslados.length === 0) {
    return <p className="text-sm text-slate-500">No hay traslados registrados todavía.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-slate-500">
          <th className="py-2 pr-4 font-medium">Equipo</th>
          <th className="py-2 pr-4 font-medium">Origen</th>
          <th className="py-2 pr-4 font-medium">Destino</th>
          <th className="py-2 pr-4 font-medium">Fecha</th>
          <th className="py-2 pr-4 font-medium">Motivo</th>
        </tr>
      </thead>
      <tbody>
        {traslados.map((traslado) => (
          <tr key={traslado.id} className="border-b border-slate-100">
            <td className="py-2 pr-4 text-slate-800">{traslado.equipo?.placa_sena ?? '—'}</td>
            <td className="py-2 pr-4 text-slate-500">{traslado.ubicacion_origen?.nombre ?? '—'}</td>
            <td className="py-2 pr-4 text-slate-500">{traslado.ubicacion_destino?.nombre ?? '—'}</td>
            <td className="py-2 pr-4 text-slate-500">{traslado.fecha_traslado}</td>
            <td className="max-w-xs truncate py-2 pr-4 text-slate-500" title={traslado.motivo ?? ''}>
              {traslado.motivo || '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
