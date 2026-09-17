import { useState } from 'react';
import { EquipoAutocomplete } from './EquipoAutocomplete';

export function MantenimientoForm({ onSubmit, onCancel, isSubmitting, serverErrors }) {
  const [equipo, setEquipo] = useState(null);
  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ equipo_id: equipo?.id, fecha_programada: fecha, descripcion: descripcion.trim() || null });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Equipo (busca por placa SENA)</label>
        <div className="mt-1">
          <EquipoAutocomplete value={equipo} onChange={setEquipo} />
        </div>
        {serverErrors?.equipo_id && <p className="mt-1 text-sm text-red-600">{serverErrors.equipo_id[0]}</p>}
      </div>

      <div>
        <label htmlFor="fecha_programada" className="block text-sm font-medium text-slate-700">
          Fecha del mantenimiento
        </label>
        <input
          id="fecha_programada"
          type="date"
          required
          value={fecha}
          onChange={(event) => setFecha(event.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        />
        {serverErrors?.fecha_programada && (
          <p className="mt-1 text-sm text-red-600">{serverErrors.fecha_programada[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-slate-700">
          Descripción (opcional)
        </label>
        <textarea
          id="descripcion"
          maxLength={500}
          rows={3}
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        />
        {serverErrors?.descripcion && <p className="mt-1 text-sm text-red-600">{serverErrors.descripcion[0]}</p>}
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
          disabled={isSubmitting || !equipo}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : 'Programar'}
        </button>
      </div>
    </form>
  );
}