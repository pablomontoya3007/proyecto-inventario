/**
 * "Eliminar" se deshabilita (con la razón en el tooltip) en los dos
 * casos que el backend rechazaría: la propia cuenta y usuarios con
 * observaciones registradas. El backend lo valida igual (UserPolicy);
 * esto solo evita que la persona intente algo que va a fallar.
 */
export function UsuarioTable({ usuarios, usuarioActualId, onEdit, onDelete }) {
  if (usuarios.length === 0) {
    return <p className="text-sm text-slate-500">No hay usuarios que coincidan con los filtros.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-slate-500">
          <th className="py-2 pr-4 font-medium">Nombre</th>
          <th className="py-2 pr-4 font-medium">Correo</th>
          <th className="py-2 pr-4 font-medium">Registrado</th>
          <th className="py-2 pr-4 font-medium">Observaciones</th>
          <th className="py-2 pr-4 font-medium text-right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {usuarios.map((usuario) => {
          const esUsuarioActual = usuario.id === usuarioActualId;
          const tieneObservaciones = (usuario.observaciones_count ?? 0) > 0;
          const motivoNoEliminar = esUsuarioActual
            ? 'No puedes eliminar tu propia cuenta'
            : tieneObservaciones
              ? 'Registró observaciones: no se puede eliminar'
              : undefined;

          return (
            <tr key={usuario.id} className="border-b border-slate-100">
              <td className="py-2 pr-4 text-ink">
                {usuario.nombre}
                {esUsuarioActual && (
                  <span className="ml-2 rounded bg-sena-soft px-1.5 py-0.5 text-xs font-medium text-sena-dark">Tú</span>
                )}
              </td>
              <td className="py-2 pr-4 text-slate-600">{usuario.correo}</td>
              <td className="py-2 pr-4 font-mono text-slate-500">{usuario.creado_en ?? '—'}</td>
              <td className="py-2 pr-4 font-mono text-slate-500">{usuario.observaciones_count ?? 0}</td>
              <td className="py-2 pr-4 text-right">
                <button onClick={() => onEdit(usuario)} className="mr-3 text-sm text-slate-600 hover:underline">
                  Editar
                </button>
                <button
                  onClick={() => onDelete(usuario)}
                  disabled={Boolean(motivoNoEliminar)}
                  title={motivoNoEliminar}
                  className="text-sm text-danger hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
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