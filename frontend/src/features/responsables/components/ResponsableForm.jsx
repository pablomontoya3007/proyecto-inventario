import { useState, useEffect } from 'react';

export function ResponsableForm({ initialValues, onSubmit, onCancel, isSubmitting, serverErrors }) {
  const [nombre, setNombre] = useState(initialValues?.nombre ?? '');
  const [documento, setDocumento] = useState(initialValues?.documento ?? '');
  const [cargo, setCargo] = useState(initialValues?.cargo ?? '');

  useEffect(() => {
    setNombre(initialValues?.nombre ?? '');
    setDocumento(initialValues?.documento ?? '');
    setCargo(initialValues?.cargo ?? '');
  }, [initialValues]);

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      nombre,
      documento: documento || null,
      cargo: cargo || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-ink">
          Nombre
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

      <div>
        <label htmlFor="documento" className="block text-sm font-medium text-ink">
          Documento (opcional)
        </label>
        <input
          id="documento"
          type="text"
          maxLength={30}
          value={documento}
          onChange={(event) => setDocumento(event.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
        />
        {serverErrors?.documento && <p className="mt-1 text-sm text-danger">{serverErrors.documento[0]}</p>}
      </div>

      <div>
        <label htmlFor="cargo" className="block text-sm font-medium text-ink">
          Cargo (opcional)
        </label>
        <input
          id="cargo"
          type="text"
          maxLength={100}
          value={cargo}
          onChange={(event) => setCargo(event.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
        />
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
