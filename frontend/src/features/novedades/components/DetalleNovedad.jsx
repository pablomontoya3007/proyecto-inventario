import { useState } from 'react';
import { EstadoNovedadBadge } from './NovedadTable';

/**
 * Detalle de una novedad. Si está abierta, incluye el formulario para
 * marcarla como resuelta (con nota opcional).
 */
export function DetalleNovedad({ novedad, onResolver, isResolviendo, errorResolver, onCerrar }) {
    const [nota, setNota] = useState('');
    const abierta = novedad.estado === 'abierta';

    function handleResolver(event) {
        event.preventDefault();
        onResolver(nota.trim() || null);
    }

    return (
        <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <dt className="text-slate-500">Placa SENA</dt>
                <dd className="font-mono text-ink">{novedad.equipo?.placa_sena ?? '—'}</dd>
                <dt className="text-slate-500">Tipo de equipo</dt>
                <dd className="text-slate-600">{novedad.equipo?.tipo_equipo ?? '—'}</dd>
                <dt className="text-slate-500">Responsable</dt>
                <dd className="text-slate-600">
                    {novedad.equipo?.responsable
                        ? `${novedad.equipo.responsable.nombre}${novedad.equipo.responsable.correo ? ` (${novedad.equipo.responsable.correo})` : ' (sin correo)'
                        }`
                        : 'Sin responsable'}
                </dd>
                <dt className="text-slate-500">Reportada por</dt>
                <dd className="text-slate-600">{novedad.usuario?.nombre ?? 'Usuario eliminado'}</dd>
                <dt className="text-slate-500">Asignada a</dt>
                <dd className="text-slate-600">
                    {novedad.asignado ? `${novedad.asignado.nombre} (${novedad.asignado.correo})` : 'Sin asignar'}
                </dd>
                <dt className="text-slate-500">Fecha</dt>
                <dd className="font-mono text-slate-600">{novedad.registrada_en}</dd>
                <dt className="text-slate-500">Estado</dt>
                <dd>
                    <EstadoNovedadBadge estado={novedad.estado} label={novedad.estado_label} />
                </dd>
            </dl>

            <div>
                <p className="mb-1 text-slate-500">Descripción</p>
                <div className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded border border-slate-200 bg-surface p-3 text-ink">
                    {novedad.descripcion}
                </div>
            </div>

            {!abierta && (
                <div className="rounded bg-sena-soft px-3 py-2">
                    <p className="font-medium text-sena-dark">
                        Resuelta el {novedad.resuelta_en} por {novedad.resuelta_por?.nombre ?? 'usuario eliminado'}
                    </p>
                    {novedad.nota_resolucion && (
                        <p className="mt-1 whitespace-pre-wrap text-slate-700">{novedad.nota_resolucion}</p>
                    )}
                </div>
            )}

            {abierta ? (
                <form onSubmit={handleResolver} className="space-y-3 border-t pt-4">
                    <div>
                        <label htmlFor="nota_resolucion" className="block text-sm font-medium text-ink">
                            Nota de resolución (opcional)
                        </label>
                        <textarea
                            id="nota_resolucion"
                            rows={3}
                            maxLength={2000}
                            value={nota}
                            onChange={(event) => setNota(event.target.value)}
                            placeholder="Ej. Se cambió el cable de poder, el equipo quedó funcionando."
                            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sena focus:outline-none"
                        />
                    </div>

                    {errorResolver && <p className="text-sm text-danger">{errorResolver}</p>}

                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onCerrar} className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
                            Cerrar
                        </button>
                        <button
                            type="submit"
                            disabled={isResolviendo}
                            className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark disabled:opacity-50"
                        >
                            {isResolviendo ? 'Guardando...' : 'Marcar como resuelta'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="flex justify-end border-t pt-4">
                    <button type="button" onClick={onCerrar} className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
                        Cerrar
                    </button>
                </div>
            )}
        </div>
    );
}