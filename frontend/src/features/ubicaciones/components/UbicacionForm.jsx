import { useState, useEffect } from 'react';
import { BuscadorCatalogoPorId } from '../../../shared/components/BuscadorCatalogo';
import { useBuscarSedes, useSedePorId } from '../../sedes/hooks/useSedes';
import { useBuscarSubsedes, useSubsedePorId } from '../../subsedes/hooks/useSubsedes';

/**
 * Buscadores en cascada: Sede solo filtra qué subsedes se buscan en el
 * segundo campo — no se envía al backend. Lo único que exige
 * UbicacionFormacionRequest es subsede_id.
 *
 * Al editar, initialValues.subsede.sede_id ya viene poblado porque
 * index() hace ->with('subsede.sede'), así que el primer select arranca
 * en el valor correcto sin pedir nada extra.
 */
export function UbicacionForm({ initialValues, onSubmit, onCancel, isSubmitting, serverErrors }) {
    const [sedeId, setSedeId] = useState(initialValues?.subsede?.sede_id ?? '');
    const [subsedeId, setSubsedeId] = useState(initialValues?.subsede_id ?? '');
    const [nombre, setNombre] = useState(initialValues?.nombre ?? '');

    useEffect(() => {
        setSedeId(initialValues?.subsede?.sede_id ?? '');
        setSubsedeId(initialValues?.subsede_id ?? '');
        setNombre(initialValues?.nombre ?? '');
    }, [initialValues]);

    function handleSedeChange(valor) {
        setSedeId(valor);
        setSubsedeId(''); // cambiar de sede invalida la subsede elegida antes
    }

    function handleSubmit(event) {
        event.preventDefault();
        onSubmit({ subsede_id: Number(subsedeId), nombre });
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
                  onChange={handleSedeChange}
                  usePorId={useSedePorId}
                  useBuscar={useBuscarSedes}
                  placeholder="Buscar sede..."
                  className="mt-1"
                  inputClassName={"mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none disabled:bg-slate-100"}
                />
            </div>

            <div>
                <label htmlFor="subsede_id" className="block text-sm font-medium text-ink">
                    Subsede
                </label>
                <BuscadorCatalogoPorId
                  id="subsede_id"
                  valueId={subsedeId}
                  onChange={setSubsedeId}
                  usePorId={useSubsedePorId}
                  useBuscar={useBuscarSubsedes}
                  parametros={{ sedeId: sedeId || undefined }}
                  disabled={!sedeId}
                  placeholder="Buscar subsede..."
                  className="mt-1"
                  inputClassName={"mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none disabled:bg-slate-100"}
                />
                {serverErrors?.subsede_id && <p className="mt-1 text-sm text-danger">{serverErrors.subsede_id[0]}</p>}
            </div>

            <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-ink">
                    Nombre de la ubicación
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
                    disabled={isSubmitting || !subsedeId}
                    className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark disabled:opacity-50"
                >
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </form>
    );
}