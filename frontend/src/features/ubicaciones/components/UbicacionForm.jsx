import { useState, useEffect } from 'react';
import { useSedes } from '../../sedes/hooks/useSedes';
import { useSubsedes } from '../../subsedes/hooks/useSubsedes';

/**
 * Select en cascada: Sede solo filtra qué subsedes se muestran en el
 * segundo select — no se envía al backend. Lo único que exige
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

    const { data: sedesData } = useSedes(1);
    const { data: subsedesData } = useSubsedes({ page: 1, sedeId: sedeId || undefined });

    useEffect(() => {
        setSedeId(initialValues?.subsede?.sede_id ?? '');
        setSubsedeId(initialValues?.subsede_id ?? '');
        setNombre(initialValues?.nombre ?? '');
    }, [initialValues]);

    function handleSedeChange(event) {
        setSedeId(event.target.value);
        setSubsedeId(''); // cambiar de sede invalida la subsede elegida antes
    }

    function handleSubmit(event) {
        event.preventDefault();
        onSubmit({ subsede_id: Number(subsedeId), nombre });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="sede_id" className="block text-sm font-medium text-slate-700">
                    Sede
                </label>
                <select
                    id="sede_id"
                    required
                    value={sedeId}
                    onChange={handleSedeChange}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
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
            </div>

            <div>
                <label htmlFor="subsede_id" className="block text-sm font-medium text-slate-700">
                    Subsede
                </label>
                <select
                    id="subsede_id"
                    required
                    disabled={!sedeId}
                    value={subsedeId}
                    onChange={(event) => setSubsedeId(event.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none disabled:bg-slate-100"
                >
                    <option value="" disabled>
                        {sedeId ? 'Selecciona una subsede' : 'Primero elige una sede'}
                    </option>
                    {subsedesData?.data.map((subsede) => (
                        <option key={subsede.id} value={subsede.id}>
                            {subsede.nombre}
                        </option>
                    ))}
                </select>
                {serverErrors?.subsede_id && <p className="mt-1 text-sm text-red-600">{serverErrors.subsede_id[0]}</p>}
            </div>

            <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-slate-700">
                    Nombre de la ubicación
                </label>
                <input
                    id="nombre"
                    type="text"
                    required
                    maxLength={150}
                    value={nombre}
                    onChange={(event) => setNombre(event.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
                />
                {serverErrors?.nombre && <p className="mt-1 text-sm text-red-600">{serverErrors.nombre[0]}</p>}
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
                    className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                >
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </form>
    );
}