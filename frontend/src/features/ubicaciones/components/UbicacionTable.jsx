export function UbicacionTable({ ubicaciones, onEdit, onDelete }) {
    if (ubicaciones.length === 0) {
        return <p className="text-sm text-slate-500">No hay ubicaciones de formación registradas todavía.</p>;
    }

    return (
        <table className="w-full text-left text-sm">
            <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-4 font-medium">Nombre</th>
                    <th className="py-2 pr-4 font-medium">Subsede</th>
                    <th className="py-2 pr-4 font-medium">Sede</th>
                    <th className="py-2 pr-4 font-medium">Equipos</th>
                    <th className="py-2 pr-4 font-medium text-right">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {ubicaciones.map((ubicacion) => {
                    const tieneEquipos = (ubicacion.equipos_count ?? 0) > 0;

                    return (
                        <tr key={ubicacion.id} className="border-b border-slate-100">
                            <td className="py-2 pr-4 text-slate-800">{ubicacion.nombre}</td>
                            <td className="py-2 pr-4 text-slate-500">{ubicacion.subsede?.nombre ?? '—'}</td>
                            <td className="py-2 pr-4 text-slate-500">{ubicacion.subsede?.sede?.nombre ?? '—'}</td>
                            <td className="py-2 pr-4 text-slate-500">{ubicacion.equipos_count ?? '—'}</td>
                            <td className="py-2 pr-4 text-right">
                                <button onClick={() => onEdit(ubicacion)} className="mr-3 text-sm text-slate-600 hover:underline">
                                    Editar
                                </button>
                                <button
                                    onClick={() => onDelete(ubicacion)}
                                    disabled={tieneEquipos}
                                    title={tieneEquipos ? 'No se puede eliminar: tiene equipos asociados' : undefined}
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