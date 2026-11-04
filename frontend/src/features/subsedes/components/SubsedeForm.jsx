import { useState, useEffect } from 'react';
import { BuscadorCatalogoPorId } from '../../../shared/components/BuscadorCatalogo';
import { useBuscarSedes, useSedePorId } from '../../sedes/hooks/useSedes';

/**
 * La sede padre se elige con un buscador (autocompletado contra el backend),
 * así que no hay límite de 15 sedes.
 *
 * sede_id sí es editable (no solo al crear): SubsedeRequest lo exige en
 * ambos casos, así que técnicamente se puede "mover" una subsede de sede.
 */
export function SubsedeForm({ initialValues, onSubmit, onCancel, isSubmitting, serverErrors }) {
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
                <BuscadorCatalogoPorId
                  id="sede_id"
                  valueId={sedeId}
                  onChange={setSedeId}
                  usePorId={useSedePorId}
                  useBuscar={useBuscarSedes}
                  placeholder="Buscar sede..."
                  className="mt-1"
                  inputClassName={"mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none disabled:bg-slate-100"}
                />
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
                    disabled={isSubmitting || !sedeId}
                    className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark disabled:opacity-50"
                >
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </form>
    );
}