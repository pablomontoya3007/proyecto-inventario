import { useState, useEffect } from 'react';

export function TipoEquipoForm({ initialValues, onSubmit, onCancel, isSubmitting, serverErrors }) {
  const [nombre, setNombre] = useState(initialValues?.nombre ?? '');
  const [activo, setActivo] = useState(initialValues?.activo ?? true);

  useEffect(() => {
    setNombre(initialValues?.nombre ?? '');
    setActivo(initialValues?.activo ?? true);
  }, [initialValues]);

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ nombre, activo });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-slate-700">
          Nombre del tipo de equipo
        </label>
        <input
          id="nombre"
          type="text"
          required
          maxLength={100}
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        />
        {serverErrors?.nombre && <p className="mt-1 text-sm text-red-600">{serverErrors.nombre[0]}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={activo} onChange={(event) => setActivo(event.target.checked)} />
        Activo (disponible al registrar equipos nuevos)
      </label>

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
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
