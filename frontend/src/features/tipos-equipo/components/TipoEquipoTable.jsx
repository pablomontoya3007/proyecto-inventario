export function TipoEquipoTable({ tipos, onEdit, onDelete }) {
  if (tipos.length === 0) {
    return <p className="text-sm text-slate-500">No hay tipos de equipo registrados todavía.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-slate-500">
          <th className="py-2 pr-4 font-medium">Nombre</th>
          <th className="py-2 pr-4 font-medium">Estado</th>
          <th className="py-2 pr-4 font-medium">Equipos</th>
          <th className="py-2 pr-4 font-medium text-right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {tipos.map((tipo) => {
          // El número mostrado respeta el filtro de estado si hay uno
          // activo (equipos_count_filtrado); si se puede eliminar
          // siempre se decide con el total SIN filtrar (equipos_count),
          // para que un tipo con equipos en otros estados no quede
          // habilitado para borrar solo porque el filtro actual da 0.
          const equiposMostrados = tipo.equipos_count_filtrado ?? tipo.equipos_count;
          const tieneEquipos = (tipo.equipos_count ?? 0) > 0;

          return (
            <tr key={tipo.id} className="border-b border-slate-100">
              <td className="py-2 pr-4 text-slate-800">{tipo.nombre}</td>
              <td className="py-2 pr-4">
                <span className={tipo.activo ? 'text-green-700' : 'text-slate-400'}>
                  {tipo.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="py-2 pr-4 text-slate-500">{equiposMostrados ?? '—'}</td>
              <td className="py-2 pr-4 text-right">
                <button onClick={() => onEdit(tipo)} className="mr-3 text-sm text-slate-600 hover:underline">
                  Editar
                </button>
                <button
                  onClick={() => onDelete(tipo)}
                  disabled={tieneEquipos}
                  title={
                    tieneEquipos
                      ? 'Tiene equipos asociados: no se puede eliminar. Considera desactivarlo en su lugar.'
                      : undefined
                  }
                  className={
                    tieneEquipos ? 'text-sm text-slate-300 cursor-not-allowed' : 'text-sm text-red-600 hover:underline'
                  }
                >
                  Eliminar
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}