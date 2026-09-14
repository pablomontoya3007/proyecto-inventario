export function ResponsableTable({ responsables, onEdit, onDelete }) {
  if (responsables.length === 0) {
    return <p className="text-sm text-slate-500">No hay responsables registrados todavía.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-slate-500">
          <th className="py-2 pr-4 font-medium">Nombre</th>
          <th className="py-2 pr-4 font-medium">Documento</th>
          <th className="py-2 pr-4 font-medium">Cargo</th>
          <th className="py-2 pr-4 font-medium text-right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {responsables.map((responsable) => (
          <tr key={responsable.id} className="border-b border-slate-100">
            <td className="py-2 pr-4 text-slate-800">{responsable.nombre}</td>
            <td className="py-2 pr-4 text-slate-500">{responsable.documento ?? '—'}</td>
            <td className="py-2 pr-4 text-slate-500">{responsable.cargo ?? '—'}</td>
            <td className="py-2 pr-4 text-right">
              <button onClick={() => onEdit(responsable)} className="mr-3 text-sm text-slate-600 hover:underline">
                Editar
              </button>
              <button onClick={() => onDelete(responsable)} className="text-sm text-red-600 hover:underline">
                Eliminar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
