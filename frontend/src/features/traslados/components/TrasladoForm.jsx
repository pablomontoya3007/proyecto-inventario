import { useState } from 'react';
import { EquipoAutocomplete } from '../../../shared/components/EquipoAutocomplete';
import { useSedes } from '../../sedes/hooks/useSedes';
import { useSubsedes } from '../../subsedes/hooks/useSubsedes';
import { useUbicaciones } from '../../ubicaciones/hooks/useUbicaciones';

/**
 * El origen del traslado NUNCA se pide aquí — el backend lo captura
 * solo, de la ubicación actual del equipo, justo antes de moverlo. Esto
 * evita que alguien pueda "mentir" sobre dónde estaba un equipo.
 */
export function TrasladoForm({ onSubmit, onCancel, isSubmitting, serverErrors }) {
  const [equipo, setEquipo] = useState(null);
  const [sedeId, setSedeId] = useState('');
  const [subsedeId, setSubsedeId] = useState('');
  const [ubicacionDestinoId, setUbicacionDestinoId] = useState('');
  const [fecha, setFecha] = useState('');
  const [motivo, setMotivo] = useState('');

  const { data: sedesData } = useSedes(1);
  const { data: subsedesData } = useSubsedes({ page: 1, sedeId: sedeId || undefined });
  const { data: ubicacionesData } = useUbicaciones({ page: 1, subsedeId: subsedeId || undefined });

  function handleSedeChange(event) {
    setSedeId(event.target.value);
    setSubsedeId('');
    setUbicacionDestinoId('');
  }

  function handleSubsedeChange(event) {
    setSubsedeId(event.target.value);
    setUbicacionDestinoId('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      equipo_id: equipo?.id,
      ubicacion_destino_id: Number(ubicacionDestinoId),
      fecha_traslado: fecha,
      motivo: motivo.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink">Equipo (busca por placa SENA)</label>
        <div className="mt-1">
          <EquipoAutocomplete value={equipo} onChange={setEquipo} />
        </div>
        {equipo?.ubicacion_formacion && (
          <p className="mt-1 text-xs text-slate-500">
            Ubicación actual: {equipo.ubicacion_formacion.nombre} / {equipo.ubicacion_formacion.subsede?.nombre} /{' '}
            {equipo.ubicacion_formacion.subsede?.sede?.nombre}
          </p>
        )}
        {serverErrors?.equipo_id && <p className="mt-1 text-sm text-danger">{serverErrors.equipo_id[0]}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="sede_destino" className="block text-sm font-medium text-ink">
            Sede destino
          </label>
          <select
            id="sede_destino"
            required
            value={sedeId}
            onChange={handleSedeChange}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
          >
            <option value="" disabled>
              Sede
            </option>
            {sedesData?.data.map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="subsede_destino" className="block text-sm font-medium text-ink">
            Subsede destino
          </label>
          <select
            id="subsede_destino"
            required
            disabled={!sedeId}
            value={subsedeId}
            onChange={handleSubsedeChange}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none disabled:bg-slate-100"
          >
            <option value="" disabled>
              Subsede
            </option>
            {subsedesData?.data.map((subsede) => (
              <option key={subsede.id} value={subsede.id}>
                {subsede.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ubicacion_destino" className="block text-sm font-medium text-ink">
            Ubicación destino
          </label>
          <select
            id="ubicacion_destino"
            required
            disabled={!subsedeId}
            value={ubicacionDestinoId}
            onChange={(event) => setUbicacionDestinoId(event.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none disabled:bg-slate-100"
          >
            <option value="" disabled>
              Ubicación
            </option>
            {ubicacionesData?.data.map((ubicacion) => (
              <option key={ubicacion.id} value={ubicacion.id}>
                {ubicacion.nombre}
              </option>
            ))}
          </select>
          {serverErrors?.ubicacion_destino_id && (
            <p className="mt-1 text-sm text-danger">{serverErrors.ubicacion_destino_id[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="fecha_traslado" className="block text-sm font-medium text-ink">
          Fecha del traslado
        </label>
        <input
          id="fecha_traslado"
          type="date"
          required
          value={fecha}
          onChange={(event) => setFecha(event.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
        />
        {serverErrors?.fecha_traslado && (
          <p className="mt-1 text-sm text-danger">{serverErrors.fecha_traslado[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="motivo" className="block text-sm font-medium text-ink">
          Motivo (opcional)
        </label>
        <textarea
          id="motivo"
          maxLength={500}
          rows={3}
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
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
          disabled={isSubmitting || !equipo || !ubicacionDestinoId}
          className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : 'Registrar traslado'}
        </button>
      </div>
    </form>
  );
}