import { useState } from 'react';
import { useEquipos } from '../../equipos/hooks/useEquipos';

/**
 * Sin campo de usuario: el backend siempre usa el autenticado del token,
 * nunca algo que mande el cliente (ver comentario en
 * ObservacionRequest.php). Sin modo "editar" — este formulario solo
 * existe para crear, porque las observaciones son inmutables una vez
 * guardadas.
 */
export function ObservacionForm({ equipoIdInicial, onSubmit, onCancel, isSubmitting, serverErrors }) {
  const [equipoId, setEquipoId] = useState(equipoIdInicial ?? '');
  const [descripcion, setDescripcion] = useState('');

  const { data: equiposData } = useEquipos({}, 1);

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ equipo_id: Number(equipoId), descripcion });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="equipo_id" className="block text-sm font-medium text-ink">
          Equipo
        </label>
        <select
          id="equipo_id"
          required
          value={equipoId}
          onChange={(event) => setEquipoId(event.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
        >
          <option value="" disabled>
            Selecciona un equipo
          </option>
          {equiposData?.data.map((equipo) => (
            <option key={equipo.id} value={equipo.id}>
              {equipo.placa_sena}
            </option>
          ))}
        </select>
        {serverErrors?.equipo_id && <p className="mt-1 text-sm text-danger">{serverErrors.equipo_id[0]}</p>}
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-ink">
          Observación
        </label>
        <textarea
          id="descripcion"
          required
          minLength={5}
          maxLength={1000}
          rows={4}
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
        />
        <p className="mt-1 text-xs text-slate-400">
          {descripcion.length}/1000 — una vez guardada, no se puede editar ni borrar.
        </p>
        {serverErrors?.descripcion && <p className="mt-1 text-sm text-danger">{serverErrors.descripcion[0]}</p>}
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
          {isSubmitting ? 'Guardando...' : 'Registrar'}
        </button>
      </div>
    </form>
  );
}
