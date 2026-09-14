/**
 * Lista tipo línea de tiempo, no tabla: las observaciones son de solo
 * lectura (sin update/delete en ningún nivel), así que no hay columna
 * de acciones que mostrar.
 *
 * "equipo" solo se muestra cuando NO viene filtrado por un equipo
 * específico — si ya se está viendo el historial de un solo equipo,
 * repetir su placa en cada tarjeta sería ruido.
 */
export function ObservacionList({ observaciones, mostrarEquipo }) {
  if (observaciones.length === 0) {
    return <p className="text-sm text-slate-500">No hay observaciones registradas todavía.</p>;
  }

  return (
    <ul className="space-y-3">
      {observaciones.map((observacion) => (
        <li key={observacion.id} className="rounded border border-slate-200 bg-white p-4">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
            <span>
              {observacion.usuario?.nombre ?? 'Usuario desconocido'}
              {mostrarEquipo && observacion.equipo?.placa_sena && (
                <>
                  {' · '}
                  <span className="font-medium text-slate-600">{observacion.equipo.placa_sena}</span>
                </>
              )}
            </span>
            <span>{new Date(observacion.registrada_en).toLocaleString('es-CO')}</span>
          </div>
          <p className="text-sm text-slate-800">{observacion.descripcion}</p>
        </li>
      ))}
    </ul>
  );
}
