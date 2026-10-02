import { useState } from 'react';

const INPUT = 'mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none';

/**
 * Al editar, la contraseña es opcional: si se deja vacía, el payload
 * no la incluye y el backend conserva la actual.
 *
 * La coincidencia entre contraseña y confirmación se revisa aquí
 * también (además de la regla "confirmed" del backend) para avisar
 * antes de enviar, sin un viaje al servidor.
 *
 * autoComplete="new-password": evita que el navegador autocomplete
 * TU contraseña guardada en el formulario de OTRO usuario.
 */
export function UsuarioForm({ initialValues, onSubmit, onCancel, isSubmitting, serverErrors }) {
  const editando = Boolean(initialValues?.id);

  const [nombre, setNombre] = useState(initialValues?.nombre ?? '');
  const [correo, setCorreo] = useState(initialValues?.correo ?? '');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errorLocal, setErrorLocal] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();
    setErrorLocal(null);

    if (password && password !== confirmacion) {
      setErrorLocal('Las contraseñas no coinciden.');
      return;
    }

    onSubmit({
      nombre: nombre.trim(),
      correo: correo.trim(),
      ...(password ? { password, password_confirmation: confirmacion } : {}),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="usuario_nombre" className="block text-sm font-medium text-ink">
          Nombre
        </label>
        <input
          id="usuario_nombre"
          type="text"
          required
          maxLength={255}
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          className={INPUT}
        />
        {serverErrors?.nombre && <p className="mt-1 text-sm text-danger">{serverErrors.nombre[0]}</p>}
      </div>

      <div>
        <label htmlFor="usuario_correo" className="block text-sm font-medium text-ink">
          Correo
        </label>
        <input
          id="usuario_correo"
          type="email"
          required
          maxLength={255}
          autoComplete="off"
          value={correo}
          onChange={(event) => setCorreo(event.target.value)}
          className={INPUT}
        />
        {serverErrors?.correo && <p className="mt-1 text-sm text-danger">{serverErrors.correo[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="usuario_password" className="block text-sm font-medium text-ink">
            {editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}
          </label>
          <input
            id="usuario_password"
            type="password"
            required={!editando}
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={INPUT}
          />
        </div>

        <div>
          <label htmlFor="usuario_password_confirmacion" className="block text-sm font-medium text-ink">
            Confirmar contraseña
          </label>
          <input
            id="usuario_password_confirmacion"
            type="password"
            required={!editando || Boolean(password)}
            autoComplete="new-password"
            value={confirmacion}
            onChange={(event) => setConfirmacion(event.target.value)}
            className={INPUT}
          />
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Mínimo 8 caracteres.
        {editando && ' Déjala vacía para conservar la actual. Si la cambias, se cerrarán las sesiones abiertas de este usuario.'}
      </p>

      {(errorLocal || serverErrors?.password) && (
        <p className="text-sm text-danger">{errorLocal ?? serverErrors.password[0]}</p>
      )}

      <div className="flex justify-end gap-2 border-t pt-4">
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
          {isSubmitting ? 'Guardando...' : editando ? 'Guardar' : 'Agregar usuario'}
        </button>
      </div>
    </form>
  );
}