import { useState, useEffect } from 'react';

const INPUT = 'mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none';

export function ResponsableForm({ initialValues, onSubmit, onCancel, isSubmitting, serverErrors }) {
  const [nombre, setNombre] = useState(initialValues?.nombre ?? '');
  const [documento, setDocumento] = useState(initialValues?.documento ?? '');
  const [cargo, setCargo] = useState(initialValues?.cargo ?? '');
  const [correo, setCorreo] = useState(initialValues?.correo ?? '');

  useEffect(() => {
    setNombre(initialValues?.nombre ?? '');
    setDocumento(initialValues?.documento ?? '');
    setCargo(initialValues?.cargo ?? '');
    setCorreo(initialValues?.correo ?? '');
  }, [initialValues]);

  // documento es obligatorio: se envía recortado y nunca como null.
  // correo es opcional: es a donde llegan las novedades de sus equipos.
  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      nombre,
      documento: documento.trim(),
      cargo: cargo || null,
      correo: correo.trim() || null,
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
          className={INPUT}
        />
        {serverErrors?.nombre && <p className="mt-1 text-sm text-danger">{serverErrors.nombre[0]}</p>}
      </div>

      <div>
        <label htmlFor="documento" className="block text-sm font-medium text-ink">
          Documento
        </label>
        <input
          id="documento"
          type="text"
          required
          maxLength={30}
          value={documento}
          onChange={(event) => setDocumento(event.target.value)}
          className={INPUT}
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
          className={INPUT}
        />
      </div>

      <div>
        <label htmlFor="correo_responsable" className="block text-sm font-medium text-ink">
          Correo (opcional)
        </label>
        <input
          id="correo_responsable"
          type="email"
          maxLength={255}
          value={correo}
          onChange={(event) => setCorreo(event.target.value)}
          className={INPUT}
        />
        <p className="mt-1 text-xs text-slate-500">
          Aquí le llegarán las notificaciones de novedades de los equipos a su cargo.
        </p>
        {serverErrors?.correo && <p className="mt-1 text-sm text-danger">{serverErrors.correo[0]}</p>}
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