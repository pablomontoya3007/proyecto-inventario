export function SedeTable({ sedes, onEdit, onDelete }) {
    if (sedes.length === 0) {
        return <p className="text-sm text-slate-500">No hay sedes registradas todavía.</p>;
    }

    return (
        <table className="w-full text-left text-sm">
            <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-4 font-medium">Nombre</th>
                    <th className="py-2 pr-4 font-medium">Subsedes</th>
                    <th className="py-2 pr-4 font-medium text-right">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {sedes.map((sede) => {
                    // subsedes_count viene de withCount() en el backend — número real,
                    // a diferencia de sede.subsedes (que solo llega poblado en show()).
                    const tieneSubsedes = (sede.subsedes_count ?? 0) > 0;

                    return (
                        <tr key={sede.id} className="border-b border-slate-100">
                            <td className="py-2 pr-4 text-slate-800">{sede.nombre}</td>
                            <td className="py-2 pr-4 text-slate-500">{sede.subsedes_count ?? '—'}</td>
                            <td className="py-2 pr-4 text-right">
                                <button onClick={() => onEdit(sede)} className="mr-3 text-sm text-slate-600 hover:underline">
                                    Editar
                                </button>
                                <button
                                    onClick={() => onDelete(sede)}
                                    disabled={tieneSubsedes}
                                    title={tieneSubsedes ? 'No se puede eliminar: tiene subsedes asociadas' : undefined}
                                    className={
                                        tieneSubsedes
                                            ? 'text-sm text-slate-300 cursor-not-allowed'
                                            : 'text-sm text-red-600 hover:underline'
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