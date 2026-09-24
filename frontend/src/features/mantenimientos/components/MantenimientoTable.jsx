// Solo estos dos van en el select — "Listo" se maneja aparte, con el
// botón "Marcar como listo" (ver más abajo), porque completar un
// mantenimiento es una acción de un solo sentido, no algo para alternar.
const ESTADOS_ACTIVOS = [
  { value: 'en_espera', label: 'En espera' },
  { value: 'en_mantenimiento', label: 'En mantenimiento' },
];

function obtenerFechaHoyLocal() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

// "Atrasado" = todavía en espera Y la fecha programada ya pasó. Uno en
// espera con fecha futura no es una alerta, es normal.
function estaAtrasado(mantenimiento) {
  if (mantenimiento.estado !== 'en_espera') return false;
  return mantenimiento.fecha_programada < obtenerFechaHoyLocal();
}

export function MantenimientoTable({ mantenimientos, onCambiarEstado, onMarcarListo, onDelete }) {
  if (mantenimientos.length === 0) {
    return <p className="text-sm text-slate-500">No hay mantenimientos activos ahora mismo.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-slate-500">
          <th className="py-2 pr-4 font-medium">Equipo</th>
          <th className="py-2 pr-4 font-medium">Fecha programada</th>
          <th className="py-2 pr-4 font-medium">Descripción</th>
          <th className="py-2 pr-4 font-medium">Estado</th>
          <th className="py-2 pr-4 font-medium text-right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {mantenimientos.map((mantenimiento) => {
          const atrasado = estaAtrasado(mantenimiento);

          return (
            <tr key={mantenimiento.id} className="border-b border-slate-100">
              <td className="py-2 pr-4 text-ink">{mantenimiento.equipo?.placa_sena ?? '—'}</td>
              <td className={`py-2 pr-4 ${atrasado ? 'font-medium text-danger' : 'text-slate-500'}`}>
                {mantenimiento.fecha_programada}
              </td>
              <td className="max-w-xs truncate py-2 pr-4 text-slate-500" title={mantenimiento.descripcion ?? ''}>
                {mantenimiento.descripcion || '—'}
              </td>
              <td className="py-2 pr-4">
                <div className="flex items-center gap-2">
                  <select
                    value={mantenimiento.estado}
                    onChange={(event) => onCambiarEstado(mantenimiento, event.target.value)}
                    className={`rounded border px-2 py-1 text-sm ${
                      atrasado ? 'border-red-300 text-danger' : 'border-slate-300'
                    }`}
                  >
                    {ESTADOS_ACTIVOS.map((opcion) => (
                      <option key={opcion.value} value={opcion.value}>
                        {opcion.label}
                      </option>
                    ))}
                  </select>
                  {atrasado && <span className="text-xs font-medium text-danger">Atrasado</span>}
                </div>
              </td>
              <td className="py-2 pr-4 text-right">
                <button
                  onClick={() => onMarcarListo(mantenimiento)}
                  className="mr-3 rounded bg-sena px-3 py-1 text-xs font-medium text-white hover:bg-sena-dark"
                >
                  Marcar como listo
                </button>
                <button onClick={() => onDelete(mantenimiento)} className="text-sm text-danger hover:underline">
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