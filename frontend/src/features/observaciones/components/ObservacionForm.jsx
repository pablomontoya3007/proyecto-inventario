import { useState } from 'react';
import { EquipoAutocomplete } from '../../../shared/components/EquipoAutocomplete';

/**
 * Sin campo de usuario: el backend siempre usa el autenticado del token,
 * nunca algo que mande el cliente (ver comentario en
 * ObservacionRequest.php). Sin modo "editar" — este formulario solo
 * existe para crear, porque las observaciones son inmutables una vez
 * guardadas.
 *
 * El equipo se elige escribiendo su placa (EquipoAutocomplete), no con
 * un <select>: el select solo cargaba los primeros 15 equipos, así que
 * el resto no se podía elegir.
 */
export function ObservacionForm({ onSubmit, onCancel, isSubmitting, serverErrors }) {
  const [equipo, setEquipo] = useState(null);
  const [falloEquipo, setFalloEquipo] = useState(false);
  const [descripcion, setDescripcion] = useState('');

  function handleEquipoChange(nuevoEquipo) {
    setEquipo(nuevoEquipo);
    if (nuevoEquipo) setFalloEquipo(false);
  }

  function handleSubmit(event) {
    event.preventDefault();

    // Escribir una placa no basta: tiene que haberse elegido un equipo
    // de la lista (o haber coincidido exacto), porque el backend recibe su id.
    if (!equipo) {
      setFalloEquipo(true);
      return;
    }

    onSubmit({ equipo_id: equipo.id, descripcion });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="equipo_id" className="block text-sm font-medium text-ink">
          Equipo (escribe la placa SENA)
        </label>
        <div className="mt-1">
          <EquipoAutocomplete id="equipo_id" value={equipo} onChange={handleEquipoChange} />
        </div>
        {falloEquipo && !equipo && (
          <p className="mt-1 text-sm text-danger">Elige un equipo de la lista para poder guardar.</p>
        )}
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