import { EstadoBadge } from '../../../shared/components/EstadoBadge';

// Igual que en EquiposListadoTabla: el backend manda la etiqueta ya
// traducida y aquí solo se mapea de vuelta para elegir el color. Solo
// pueden llegar estos dos: el reporte excluye de baja y extraviados.
const ESTADO_CRUDO_POR_ETIQUETA = {
  Activo: 'activo',
  'En mantenimiento': 'mantenimiento',
};

export function EquiposSinLicenciaTabla({ filas }) {
  if (filas.length === 0) {
    return <p className="text-sm text-slate-400">Todos los equipos de este filtro tienen licencia.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-slate-500">
          <th className="py-2 pr-4 font-medium">Placa SENA</th>
          <th className="py-2 pr-4 font-medium">Hostname</th>
          <th className="py-2 pr-4 font-medium">Tipo</th>
          <th className="py-2 pr-4 font-medium">Cuentadante</th>
          <th className="py-2 pr-4 font-medium">Sede</th>
          <th className="py-2 pr-4 font-medium">Subsede</th>
          <th className="py-2 pr-4 font-medium">Ubicación</th>
          <th className="py-2 pr-4 font-medium">Estado</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((fila) => (
          <tr key={fila.placa_sena} className="border-b border-slate-100">
            <td className="py-2 pr-4 font-mono text-ink">{fila.placa_sena}</td>
            <td className="py-2 pr-4 text-slate-500">{fila.hostname}</td>
            <td className="py-2 pr-4 text-slate-500">{fila.tipo}</td>
            <td className="py-2 pr-4 text-slate-500">{fila.responsable}</td>
            <td className="py-2 pr-4 text-slate-500">{fila.sede}</td>
            <td className="py-2 pr-4 text-slate-500">{fila.subsede}</td>
            <td className="py-2 pr-4 text-slate-500">{fila.ubicacion}</td>
            <td className="py-2 pr-4">
              <EstadoBadge estado={ESTADO_CRUDO_POR_ETIQUETA[fila.estado] ?? null} label={fila.estado} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}