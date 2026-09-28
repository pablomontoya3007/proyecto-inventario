// Nombres legibles de cada entidad auditada — confirmado contra el
// booted() de cada modelo en el backend (los mismos 9 que llevan
// static::observe(AuditoriaObserver::class)).
const ENTIDADES_LEGIBLES = {
  Equipo: 'Equipo',
  Sede: 'Sede',
  Subsede: 'Subsede',
  UbicacionFormacion: 'Ubicación',
  TipoEquipo: 'Tipo de equipo',
  Responsable: 'Responsable',
  LicenciaOffice: 'Licencia de Office',
  Mantenimiento: 'Mantenimiento',
  Traslado: 'Traslado',
};

const ESTILOS_ACCION = {
  creado: 'bg-sena-soft text-sena-dark',
  actualizado: 'bg-info/10 text-info',
  eliminado: 'bg-danger/10 text-danger',
};

const ETIQUETAS_ACCION = {
  creado: 'Creado',
  actualizado: 'Actualizado',
  eliminado: 'Eliminado',
};

function formatearValor(valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (typeof valor === 'object') return JSON.stringify(valor);
  return String(valor);
}

// "actualizado" trae {campo: {antes, despues}}; "creado"/"eliminado"
// traen {campo: valor} directo — cada forma se muestra distinto.
function DetalleCambios({ accion, cambios }) {
  const entradas = Object.entries(cambios ?? {});

  if (entradas.length === 0) {
    return <p className="px-1 py-2 text-xs text-slate-400">Sin detalle.</p>;
  }

  return (
    <ul className="space-y-1 px-1 py-2">
      {entradas.map(([campo, valor]) => (
        <li key={campo} className="text-xs text-slate-600">
          <span className="font-medium text-ink">{campo}:</span>{' '}
          {accion === 'actualizado' ? (
            <>
              <span className="text-danger line-through">{formatearValor(valor.antes)}</span>
              {' → '}
              <span className="text-sena-dark">{formatearValor(valor.despues)}</span>
            </>
          ) : (
            <span>{formatearValor(valor)}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Cada fila usa <details>/<summary> nativo de HTML para expandir el
 * detalle de campos cambiados — sin necesitar estado de React para
 * saber qué fila está abierta.
 */
export function AuditoriaTabla({ auditorias }) {
  if (auditorias.length === 0) {
    return <p className="text-sm text-slate-500">No hay registros de auditoría para este filtro.</p>;
  }

  return (
    <div className="divide-y divide-slate-100">
      {auditorias.map((registro) => (
        <details key={registro.id} className="py-2">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  ESTILOS_ACCION[registro.accion] ?? 'bg-slate-100 text-slate-600'
                }`}
              >
                {ETIQUETAS_ACCION[registro.accion] ?? registro.accion}
              </span>
              <span className="text-ink">{ENTIDADES_LEGIBLES[registro.entidad] ?? registro.entidad}</span>
              <span className="font-mono text-slate-400">#{registro.entidad_id}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>{registro.usuario}</span>
              <span className="font-mono">{registro.fecha}</span>
            </div>
          </summary>
          <DetalleCambios accion={registro.accion} cambios={registro.cambios} />
        </details>
      ))}
    </div>
  );
}
