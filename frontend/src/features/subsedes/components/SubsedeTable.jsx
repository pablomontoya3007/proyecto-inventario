export function SubsedeTable({ subsedes, onEdit, onDelete }) {
    if (subsedes.length === 0) {
        return <p className="text-sm text-slate-500">No hay subsedes registradas todavía.</p>;
    }

    return (
        <table className="w-full text-left text-sm">
            <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-4 font-medium">Nombre</th>
                    <th className="py-2 pr-4 font-medium">Sede</th>
                    <th className="py-2 pr-4 font-medium">Ubicaciones</th>
                    <th className="py-2 pr-4 font-medium text-right">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {subsedes.map((subsede) => {
                    const tieneUbicaciones = (subsede.ubicaciones_formacion_count ?? 0) > 0;

                    return (
                        <tr key={subsede.id} className="border-b border-slate-100">
                            <td className="py-2 pr-4 text-ink">{subsede.nombre}</td>
                            <td className="py-2 pr-4 text-slate-500">{subsede.sede?.nombre ?? '—'}</td>
                            <td className="py-2 pr-4 text-slate-500">{subsede.ubicaciones_formacion_count ?? '—'}</td>
                            <td className="py-2 pr-4 text-right">
                                <button onClick={() => onEdit(subsede)} className="mr-3 text-sm text-slate-600 hover:underline">
                                    Editar
                                </button>
                                <button
                                    onClick={() => onDelete(subsede)}
                                    disabled={tieneUbicaciones}
                                    title={tieneUbicaciones ? 'No se puede eliminar: tiene ubicaciones de formación asociadas' : undefined}
                                    className={
                                        tieneUbicaciones
                                            ? 'text-sm text-slate-300 cursor-not-allowed'
                                            : 'text-sm text-danger hover:underline'
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