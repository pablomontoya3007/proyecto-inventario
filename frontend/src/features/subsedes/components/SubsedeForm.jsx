import { useState, useEffect } from 'react';
import { useSedes } from '../../sedes/hooks/useSedes';

/**
 * Reutiliza useSedes (módulo Sedes) para poblar el selector de sede padre.
 * OJO: trae la página 1 (máx. 15 sedes), porque el backend no tiene un
 * endpoint sin paginar para listas de selección. Si el proyecto llega a
 * tener más de 15 sedes, este selector no las va a mostrar todas — no es
 * un caso que resuelva ahora mismo, pero avísame si aplica.
 *
 * sede_id sí es editable (no solo al crear): SubsedeRequest lo exige en
 * ambos casos, así que técnicamente se puede "mover" una subsede de sede.
 */
export function SubsedeForm({ initialValues, onSubmit, onCancel, isSubmitting, serverErrors }) {
    const { data: sedesData } = useSedes(1);
    const [sedeId, setSedeId] = useState(initialValues?.sede_id ?? '');
    const [nombre, setNombre] = useState(initialValues?.nombre ?? '');

    useEffect(() => {
        setSedeId(initialValues?.sede_id ?? '');
        setNombre(initialValues?.nombre ?? '');
    }, [initialValues]);

    function handleSubmit(event) {
        event.preventDefault();
        onSubmit({ sede_id: Number(sedeId), nombre });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="sede_id" className="block text-sm font-medium text-ink">
                    Sede
                </label>
                <select
                    id="sede_id"
                    required
                    value={sedeId}
                    onChange={(event) => setSedeId(event.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
                >
                    <option value="" disabled>
                        Selecciona una sede
                    </option>
                    {sedesData?.data.map((sede) => (
                        <option key={sede.id} value={sede.id}>
                            {sede.nombre}
                        </option>
                    ))}
                </select>
                {serverErrors?.sede_id && <p className="mt-1 text-sm text-danger">{serverErrors.sede_id[0]}</p>}
            </div>

            <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-ink">
                    Nombre de la subsede
                </label>
                <input
                    id="nombre"
                    type="text"
                    required
                    maxLength={150}
                    value={nombre}
                    onChange={(event) => setNombre(event.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
                />
                {serverErrors?.nombre && <p className="mt-1 text-sm text-danger">{serverErrors.nombre[0]}</p>}
            </div>

            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark disabled:opacity-50"
                >
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </form>
    );
}