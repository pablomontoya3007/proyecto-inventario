import { useState, useEffect } from 'react';

/**
 * Un solo formulario para crear y editar, porque el backend también usa
 * un único SedeRequest para ambos casos (con Rule::unique(...)->ignore()
 * resolviendo el choque de nombre al editar). Si initialValues es null,
 * es "crear"; si trae un objeto con id, es "editar".
 */
export function SedeForm({ initialValues, onSubmit, onCancel, isSubmitting, serverErrors }) {
    const [nombre, setNombre] = useState(initialValues?.nombre ?? '');

    useEffect(() => {
        setNombre(initialValues?.nombre ?? '');
    }, [initialValues]);

    function handleSubmit(event) {
        event.preventDefault();
        onSubmit({ nombre });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-ink">
                    Nombre de la sede
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
                {/* Errores 422 de Laravel: { errors: { nombre: ["..."] } } */}
                {serverErrors?.nombre && (
                    <p className="mt-1 text-sm text-danger">{serverErrors.nombre[0]}</p>
                )}
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