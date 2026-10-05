import { useState } from 'react';
import { EquipoAutocomplete } from '../../../shared/components/EquipoAutocomplete';
import { BuscadorUsuario } from '../../usuarios/components/BuscadorUsuario';

/**
 * Quien reporta la novedad NO se elige: es siempre el usuario con la
 * sesión iniciada (lo pone el backend).
 *
 * Correos que se envían al registrar:
 * - al responsable del equipo (si tiene correo);
 * - al usuario asignado para revisarla (si se elige uno).
 * Antes de guardar se muestra a quién le llegará cada uno.
 */
export function NovedadForm({ onSubmit, onCancel, isSubmitting, serverErrors }) {
    const [equipo, setEquipo] = useState(null);
    const [descripcion, setDescripcion] = useState('');
    const [asignado, setAsignado] = useState(null);

    const responsable = equipo?.responsable;

    function handleSubmit(event) {
        event.preventDefault();
        if (!equipo) return;
        onSubmit({
            equipo_id: equipo.id,
            descripcion: descripcion.trim(),
            asignado_a: asignado?.id ?? null,
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="novedad_equipo" className="block text-sm font-medium text-ink">
                    Equipo (escribe la placa SENA)
                </label>
                <div className="mt-1">
                    <EquipoAutocomplete id="novedad_equipo" value={equipo} onChange={setEquipo} />
                </div>
                {serverErrors?.equipo_id && <p className="mt-1 text-sm text-danger">{serverErrors.equipo_id[0]}</p>}

                {equipo &&
                    (responsable?.correo ? (
                        <p className="mt-2 rounded bg-sena-soft px-3 py-2 text-xs text-sena-dark">
                            Se le avisará al responsable del equipo: {responsable.nombre} ({responsable.correo}).
                        </p>
                    ) : (
                        <p className="mt-2 rounded bg-warning/20 px-3 py-2 text-xs text-ink">
                            {responsable
                                ? `El responsable ${responsable.nombre} no tiene correo registrado: no se le enviará correo. Puedes agregárselo en Responsables.`
                                : 'Este equipo no tiene responsable asignado: no se le enviará correo a ningún responsable.'}
                        </p>
                    ))}
            </div>

            <div>
                <label htmlFor="novedad_asignado" className="block text-sm font-medium text-ink">
                    Asignar revisión a (opcional)
                </label>
                <BuscadorUsuario
                    id="novedad_asignado"
                    value={asignado}
                    onChange={setAsignado}
                    placeholder="Usuario que revisará la novedad..."
                    className="mt-1"
                    inputClassName="rounded border border-slate-300 px-3 py-2 text-sm focus:border-sena focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">
                    {asignado
                        ? `Se le enviará un correo a ${asignado.nombre} (${asignado.correo}) para que la revise.`
                        : 'El usuario asignado recibe un correo con la placa, quién la reportó y la descripción.'}
                </p>
                {serverErrors?.asignado_a && <p className="mt-1 text-sm text-danger">{serverErrors.asignado_a[0]}</p>}
            </div>

            <div>
                <label htmlFor="novedad_descripcion" className="block text-sm font-medium text-ink">
                    Descripción de la novedad
                </label>
                <textarea
                    id="novedad_descripcion"
                    required
                    minLength={5}
                    maxLength={2000}
                    rows={5}
                    value={descripcion}
                    onChange={(event) => setDescripcion(event.target.value)}
                    placeholder="Ej. La pantalla no enciende; se reportó en la clase de la mañana."
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sena focus:outline-none"
                />
                {serverErrors?.descripcion && <p className="mt-1 text-sm text-danger">{serverErrors.descripcion[0]}</p>}
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
                <button type="button" onClick={onCancel} className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !equipo}
                    className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark disabled:opacity-50"
                >
                    {isSubmitting ? 'Registrando...' : 'Registrar novedad'}
                </button>
            </div>
        </form>
    );
}