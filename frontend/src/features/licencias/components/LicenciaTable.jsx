import { LicenciaPasswordCell } from './LicenciaPasswordCell';
import { EstadoBadge } from '../../../shared/components/EstadoBadge';

// Arma "Sede › Subsede › Ambiente" a partir de las relaciones anidadas
// que trae equipo (equipo.ubicacion_formacion.subsede.sede) — si algún
// tramo falta se omite en vez de mostrar un "—" suelto en medio de la
// ruta.
function ubicacionTexto(licencia) {
  const ubicacion = licencia.equipo?.ubicacion_formacion;
  if (!ubicacion) return '—';

  const subsede = ubicacion.subsede;
  const sede = subsede?.sede;

  return [sede?.nombre, subsede?.nombre, ubicacion.nombre].filter(Boolean).join(' › ');
}

export function LicenciaTable({ licencias, onEdit, onDelete }) {
  if (licencias.length === 0) {
    return <p className="text-sm text-slate-500">No hay licencias registradas todavía.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-slate-500">
          <th className="py-2 pr-4 font-medium">Equipo</th>
          <th className="py-2 pr-4 font-medium">Ubicación</th>
          <th className="py-2 pr-4 font-medium">Correo</th>
          <th className="py-2 pr-4 font-medium">Contraseña</th>
          <th className="py-2 pr-4 font-medium">Estado</th>
          <th className="py-2 pr-4 font-medium">Última actualización</th>
          <th className="py-2 pr-4 font-medium text-right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {licencias.map((licencia) => (
          <tr key={licencia.id} className="border-b border-slate-100">
            <td className="py-2 pr-4 font-mono text-ink">{licencia.equipo?.placa_sena ?? '—'}</td>
            <td className="py-2 pr-4 text-slate-500">{ubicacionTexto(licencia)}</td>
            <td className="py-2 pr-4 text-slate-500">{licencia.correo}</td>
            <td className="py-2 pr-4">
              <LicenciaPasswordCell licenciaId={licencia.id} />
            </td>
            <td className="py-2 pr-4">
              <EstadoBadge estado={licencia.estado_licencia} label={licencia.estado_licencia_label ?? '—'} />
            </td>
            <td className="py-2 pr-4 font-mono text-slate-500">{licencia.fecha_actualizacion ?? '—'}</td>
            <td className="py-2 pr-4 text-right">
              <button onClick={() => onEdit(licencia)} className="mr-3 text-sm text-slate-600 hover:underline">
                Editar
              </button>
              <button onClick={() => onDelete(licencia)} className="text-sm text-danger hover:underline">
                Eliminar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
