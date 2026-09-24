// Mapa de valores de estado (los mismos strings que ya vienen del
// backend en los distintos enums: EstadoEquipo, EstadoLicencia,
// EstadoMantenimiento) a los colores semánticos del acta — nunca
// decorativos, solo para representar el estado real de algo.
const ESTILOS_POR_ESTADO = {
  // Equipo
  activo: 'bg-sena-soft text-sena-dark',
  mantenimiento: 'bg-amber-50 text-warning',
  de_baja: 'bg-red-50 text-danger',
  extraviado: 'bg-red-50 text-danger',
  // Licencia
  activa: 'bg-sena-soft text-sena-dark',
  vencida: 'bg-red-50 text-danger',
  suspendida: 'bg-blue-50 text-info',
  // Mantenimiento
  en_espera: 'bg-amber-50 text-warning',
  en_mantenimiento: 'bg-blue-50 text-info',
  listo: 'bg-sena-soft text-sena-dark',
};

/**
 * `estado` es el valor crudo del enum (ej. 'activo', 'de_baja') — se usa
 * solo para elegir el color. `label` es el texto ya traducido que viene
 * del backend (ej. estado_label) — se usa solo para mostrar.
 */
export function EstadoBadge({ estado, label }) {
  const estilo = ESTILOS_POR_ESTADO[estado] ?? 'bg-slate-100 text-slate-600';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estilo}`}>
      {label}
    </span>
  );
}
