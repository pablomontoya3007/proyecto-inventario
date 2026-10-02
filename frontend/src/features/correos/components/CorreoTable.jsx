export function EstadoCorreoBadge({ estado, label }) {
  const estilos = estado === 'enviado' ? 'bg-sena-soft text-sena-dark' : 'bg-danger/10 text-danger';
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${estilos}`}>{label}</span>;
}

// "ana@x.com y 4 más": la lista completa se ve en el detalle.
function resumenDestinatarios(destinatarios) {
  if (destinatarios.length === 0) return '—';
  if (destinatarios.length === 1) return destinatarios[0];
  return `${destinatarios[0]} y ${destinatarios.length - 1} más`;
}

export function CorreoTable({ correos, onVer }) {
  if (correos.length === 0) {
    return <p className="text-sm text-slate-500">No hay correos que coincidan con los filtros.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-slate-500">
          <th className="py-2 pr-4 font-medium">Fecha</th>
          <th className="py-2 pr-4 font-medium">Asunto</th>
          <th className="py-2 pr-4 font-medium">Para</th>
          <th className="py-2 pr-4 font-medium">Enviado por</th>
          <th className="py-2 pr-4 font-medium">Estado</th>
          <th className="py-2 pr-4 font-medium text-right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {correos.map((correo) => (
          <tr key={correo.id} className="border-b border-slate-100">
            <td className="whitespace-nowrap py-2 pr-4 font-mono text-slate-500">{correo.enviado_en}</td>
            <td className="max-w-xs truncate py-2 pr-4 text-ink" title={correo.asunto}>
              {correo.asunto}
            </td>
            <td className="max-w-xs truncate py-2 pr-4 text-slate-600" title={correo.destinatarios.join(', ')}>
              {resumenDestinatarios(correo.destinatarios)}
            </td>
            <td className="py-2 pr-4 text-slate-600">{correo.remitente?.nombre ?? 'Usuario eliminado'}</td>
            <td className="py-2 pr-4">
              <EstadoCorreoBadge estado={correo.estado} label={correo.estado_label} />
            </td>
            <td className="py-2 pr-4 text-right">
              <button onClick={() => onVer(correo)} className="text-sm text-slate-600 hover:underline">
                Ver
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}