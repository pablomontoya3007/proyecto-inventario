export function HistorialMantenimientoTable({ mantenimientos, onDelete }) {
  if (mantenimientos.length === 0) {
    return <p className="text-sm text-slate-500">Todavía no hay mantenimientos completados.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-slate-500">
          <th className="py-2 pr-4 font-medium">Equipo</th>
          <th className="py-2 pr-4 font-medium">Fecha programada</th>
          <th className="py-2 pr-4 font-medium">Descripción</th>
          <th className="py-2 pr-4 font-medium">Fecha completado</th>
          <th className="py-2 pr-4 font-medium text-right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {mantenimientos.map((mantenimiento) => (
          <tr key={mantenimiento.id} className="border-b border-slate-100">
            <td className="py-2 pr-4 text-ink">{mantenimiento.equipo?.placa_sena ?? '—'}</td>
            <td className="py-2 pr-4 text-slate-500">{mantenimiento.fecha_programada}</td>
            <td className="max-w-xs truncate py-2 pr-4 text-slate-500" title={mantenimiento.descripcion ?? ''}>
              {mantenimiento.descripcion || '—'}
            </td>
            <td className="py-2 pr-4 text-slate-500">{mantenimiento.fecha_completado ?? '—'}</td>
            <td className="py-2 pr-4 text-right">
              <button onClick={() => onDelete(mantenimiento)} className="text-sm text-danger hover:underline">
                Eliminar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}