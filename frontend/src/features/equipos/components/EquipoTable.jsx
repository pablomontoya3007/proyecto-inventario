import { EstadoBadge } from '../../../shared/components/EstadoBadge';

export function EquipoTable({ equipos, onVerHojaDeVida, onEdit, onDelete }) {
  if (equipos.length === 0) {
    return <p className="text-sm text-slate-500">No hay equipos registrados todavía.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-slate-500">
          <th className="py-2 pr-4 font-medium">Placa SENA</th>
          <th className="py-2 pr-4 font-medium">Tipo</th>
          <th className="py-2 pr-4 font-medium">Ubicación</th>
          <th className="py-2 pr-4 font-medium">Responsable</th>
          <th className="py-2 pr-4 font-medium">Estado</th>
          <th className="py-2 pr-4 font-medium text-right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {equipos.map((equipo) => (
          <tr key={equipo.id} className="border-b border-slate-100">
            {/* Roboto Mono para la placa: es un identificador tabular,
                igual que serial/MAC/fechas (norma 4.1 del acta). */}
            <td className="py-2 pr-4 font-mono text-ink">{equipo.placa_sena}</td>
            <td className="py-2 pr-4 text-slate-500">{equipo.tipo_equipo?.nombre ?? '—'}</td>
            <td className="py-2 pr-4 text-slate-500">
              {equipo.ubicacion_formacion?.nombre ?? '—'}
              {equipo.ubicacion_formacion?.subsede?.nombre && (
                <span className="text-slate-400"> / {equipo.ubicacion_formacion.subsede.nombre}</span>
              )}
            </td>
            <td className="py-2 pr-4 text-slate-500">{equipo.responsable?.nombre ?? 'Sin asignar'}</td>
            {/* estado_label ya viene calculado desde el backend (enum
                EstadoEquipo::label()); estado (crudo) decide el color. */}
            <td className="py-2 pr-4">
              <EstadoBadge estado={equipo.estado} label={equipo.estado_label ?? '—'} />
            </td>
            <td className="py-2 pr-4 text-right">
              <button
                onClick={() => onVerHojaDeVida(equipo)}
                className="mr-3 text-sm text-slate-600 hover:underline"
              >
                Hoja de vida
              </button>
              <button onClick={() => onEdit(equipo)} className="mr-3 text-sm text-slate-600 hover:underline">
                Editar
              </button>
              <button onClick={() => onDelete(equipo)} className="text-sm text-danger hover:underline">
                Eliminar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
