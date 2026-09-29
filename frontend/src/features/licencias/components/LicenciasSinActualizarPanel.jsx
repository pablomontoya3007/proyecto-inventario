import { useState } from 'react';
import { useLicenciasSinActualizar } from '../hooks/useLicencias';
import { EstadoBadge } from '../../../shared/components/EstadoBadge';

/**
 * Notificación de vencimiento: licencias con más de N meses sin
 * actualizarse (N lo define el backend y llega en `meses_limite`).
 *
 * Se recalcula en cada consulta, no se guarda: no hay "leída/no leída".
 * En cuanto se cambia la contraseña o el correo de una licencia, sale sola
 * de aquí.
 *
 * `onVerLicencia(placa)` deja que la página filtre su lista por esa placa,
 * para llegar rápido al botón Editar de esa licencia.
 */
export function LicenciasSinActualizarPanel({ onVerLicencia }) {
    const [page, setPage] = useState(1);
    const [abierto, setAbierto] = useState(false);
    const { data, isLoading, isError } = useLicenciasSinActualizar(page);

    if (isLoading) return null;

    // Un fallo aquí no se calla: si la alerta no carga, nadie se enteraría
    // de que hay licencias atrasadas.
    if (isError) {
        return <p className="mb-4 text-sm text-danger">No se pudieron cargar las notificaciones de vencimiento.</p>;
    }

    const total = data.meta.total;
    const meses = data.meses_limite;

    if (total === 0) {
        return (
            <p className="mb-4 rounded border border-sena/30 bg-sena-soft px-4 py-2 text-sm text-sena-dark">
                ✓ Todas las licencias se actualizaron en los últimos {meses} meses.
            </p>
        );
    }

    return (
        <section className="mb-4 rounded border border-warning/40 bg-warning/10">
            <button
                type="button"
                onClick={() => setAbierto((valor) => !valor)}
                aria-expanded={abierto}
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
            >
                <span className="text-sm text-ink">
                    <span className="font-semibold">Atención:</span> {total} {total === 1 ? 'licencia lleva' : 'licencias llevan'}{' '}
                    más de {meses} meses sin actualizarse
                </span>
                <span className="shrink-0 text-xs text-slate-600 underline">{abierto ? 'Ocultar' : 'Ver detalle'}</span>
            </button>

            {abierto && (
                <div className="border-t border-warning/30 bg-white px-4 py-3">
                    <p className="mb-3 text-xs text-slate-500">
                        La fecha de actualización cambia al cambiar la contraseña o el correo de la licencia (Editar → nueva
                        contraseña, o un correo distinto). Al hacerlo, la licencia deja de aparecer aquí.
                    </p>

                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                                <th className="py-2 pr-4 font-medium">Equipo</th>
                                <th className="py-2 pr-4 font-medium">Ubicación</th>
                                <th className="py-2 pr-4 font-medium">Correo</th>
                                <th className="py-2 pr-4 font-medium">Estado</th>
                                <th className="py-2 pr-4 font-medium">Última actualización</th>
                                <th className="py-2 pr-4 font-medium">Sin actualizar</th>
                                <th className="py-2 pr-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.data.map((licencia) => (
                                <tr key={licencia.id} className="border-b border-slate-100">
                                    <td className="py-2 pr-4 font-mono text-ink">{licencia.placa_sena}</td>
                                    <td className="py-2 pr-4 text-slate-500">{licencia.ubicacion || '—'}</td>
                                    <td className="py-2 pr-4 text-slate-500">{licencia.correo}</td>
                                    <td className="py-2 pr-4">
                                        <EstadoBadge estado={licencia.estado_licencia} label={licencia.estado_licencia_label ?? '—'} />
                                    </td>
                                    <td className="py-2 pr-4 font-mono text-slate-500">
                                        {licencia.fecha_actualizacion ?? 'Sin fecha'}
                                    </td>
                                    <td className="py-2 pr-4 font-mono text-danger">
                                        {licencia.dias_sin_actualizar !== null ? `${licencia.dias_sin_actualizar} días` : '—'}
                                    </td>
                                    <td className="py-2 pr-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => onVerLicencia(licencia.placa_sena)}
                                            className="text-sm text-slate-600 hover:underline"
                                        >
                                            Ver en la lista
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {data.meta.last_page > 1 && (
                        <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">
                                Anterior
                            </button>
                            <span>
                                Página {data.meta.current_page} de {data.meta.last_page}
                            </span>
                            <button
                                disabled={page >= data.meta.last_page}
                                onClick={() => setPage((p) => p + 1)}
                                className="disabled:opacity-40"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}