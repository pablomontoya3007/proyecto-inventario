import { EstadoCorreoBadge } from './CorreoTable';

/**
 * Detalle de un correo del historial. Si falló, muestra el error técnico
 * y el botón "Reintentar", que abre el formulario ya lleno.
 */
export function DetalleCorreo({ correo, onReintentar, onCerrar }) {
  return (
    <div className="space-y-4 text-sm">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-slate-500">Asunto</dt>
        <dd className="font-medium text-ink">{correo.asunto}</dd>
        <dt className="text-slate-500">Fecha</dt>
        <dd className="font-mono text-slate-600">{correo.enviado_en}</dd>
        <dt className="text-slate-500">Enviado por</dt>
        <dd className="text-slate-600">{correo.remitente?.nombre ?? 'Usuario eliminado'}</dd>
        <dt className="text-slate-500">Estado</dt>
        <dd>
          <EstadoCorreoBadge estado={correo.estado} label={correo.estado_label} />
        </dd>
      </dl>

      {correo.estado === 'fallido' && correo.error && (
        <div className="rounded bg-danger/10 px-3 py-2">
          <p className="font-medium text-danger">No se pudo enviar</p>
          <p className="mt-1 break-words font-mono text-xs text-slate-600">{correo.error}</p>
        </div>
      )}

      <div>
        <p className="mb-1 text-slate-500">Para ({correo.total_destinatarios})</p>
        <div className="flex max-h-28 flex-wrap gap-1 overflow-y-auto">
          {correo.destinatarios.map((destinatario) => (
            <span key={destinatario} className="rounded bg-surface px-2 py-0.5 text-xs text-slate-600">
              {destinatario}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-slate-500">Mensaje</p>
        <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded border border-slate-200 bg-surface p-3 text-ink">
          {correo.cuerpo}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        {correo.estado === 'fallido' && (
          <button
            type="button"
            onClick={() => onReintentar(correo)}
            className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark"
          >
            Reintentar
          </button>
        )}
        <button type="button" onClick={onCerrar} className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
          Cerrar
        </button>
      </div>
    </div>
  );
}