export function EstadoNovedadBadge({ estado, label }) {
    const estilos = estado === 'abierta' ? 'bg-warning/20 text-ink' : 'bg-sena-soft text-sena-dark';
    return <span className={`rounded px-2 py-0.5 text-xs font-medium ${estilos}`}>{label}</span>;
}

export function NovedadTable({ novedades, onVer }) {
    if (novedades.length === 0) {
        return <p className="text-sm text-slate-500">No hay novedades que coincidan con los filtros.</p>;
    }

    return (
        <table className="w-full text-left text-sm">
            <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-4 font-medium">Fecha</th>
                    <th className="py-2 pr-4 font-medium">Placa SENA</th>
                    <th className="py-2 pr-4 font-medium">Descripción</th>
                    <th className="py-2 pr-4 font-medium">Reportada por</th>
                    <th className="py-2 pr-4 font-medium">Asignada a</th>
                    <th className="py-2 pr-4 font-medium">Estado</th>
                    <th className="py-2 pr-4 font-medium text-right">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {novedades.map((novedad) => (
                    <tr key={novedad.id} className="border-b border-slate-100">
                        <td className="whitespace-nowrap py-2 pr-4 font-mono text-slate-500">{novedad.registrada_en}</td>
                        <td className="py-2 pr-4 font-mono text-ink">{novedad.equipo?.placa_sena ?? '—'}</td>
                        <td className="max-w-xs truncate py-2 pr-4 text-slate-600" title={novedad.descripcion}>
                            {novedad.descripcion}
                        </td>
                        <td className="py-2 pr-4 text-slate-600">{novedad.usuario?.nombre ?? 'Usuario eliminado'}</td>
                        <td className="py-2 pr-4 text-slate-600" title={novedad.asignado?.correo ?? ''}>
                            {novedad.asignado?.nombre ?? <span className="text-slate-400">Sin asignar</span>}
                        </td>
                        <td className="py-2 pr-4">
                            <EstadoNovedadBadge estado={novedad.estado} label={novedad.estado_label} />
                        </td>
                        <td className="py-2 pr-4 text-right">
                            <button onClick={() => onVer(novedad)} className="text-sm text-slate-600 hover:underline">
                                {novedad.estado === 'abierta' ? 'Ver / resolver' : 'Ver'}
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}