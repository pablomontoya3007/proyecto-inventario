import { useState, useMemo } from 'react';
import { useEquipos } from '../../equipos/hooks/useEquipos';

// Confirmado contra app/Enums/EstadoLicencia.php.
const ESTADOS_LICENCIA = [
  { value: 'activa', label: 'Activa' },
  { value: 'vencida', label: 'Vencida' },
  { value: 'suspendida', label: 'Suspendida' },
];

/**
 * La contraseña nunca llega desde el backend (ni cifrada) — por diseño,
 * LicenciaOfficeResource la omite siempre. Por eso este campo SIEMPRE
 * arranca vacío, incluso al editar: dejarlo en blanco al guardar
 * conserva la contraseña actual (así lo maneja el Controller); escribir
 * algo la reemplaza.
 *
 * equipo_id tiene una restricción única (un equipo, máximo una
 * licencia) que no se valida aquí de antemano — si ya existe una para
 * el equipo elegido, el 422 llega bajo ese mismo campo, igual que
 * cualquier otro error de servidor.
 *
 * El listado de equipos del select viene de la página 1 (máx. 15),
 * mismo límite conocido que en Equipos/Responsables — el equipo ya
 * asignado se agrega igual si no cae ahí, para no perder la selección
 * al editar.
 */
export function LicenciaForm({ initialValues, onSubmit, onCancel, isSubmitting, serverErrors }) {
  const [equipoId, setEquipoId] = useState(initialValues?.equipo_id ?? '');
  const [correo, setCorreo] = useState(initialValues?.correo ?? '');
  const [password, setPassword] = useState('');
  const [estadoLicencia, setEstadoLicencia] = useState(initialValues?.estado_licencia ?? 'activa');

  const { data: equiposData } = useEquipos({}, 1);

  const equiposDisponibles = useMemo(() => {
    const lista = equiposData?.data ?? [];
    const actual = initialValues?.equipo;
    if (actual && !lista.some((e) => e.id === actual.id)) {
      return [...lista, actual];
    }
    return lista;
  }, [equiposData, initialValues]);

  const esEdicion = Boolean(initialValues?.id);

  function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      equipo_id: Number(equipoId),
      correo,
      estado_licencia: estadoLicencia,
    };

    // Solo se manda si el usuario escribió algo — en edición, dejarlo
    // vacío significa "no cambiar la contraseña actual".
    if (password.trim() !== '') {
      payload.password = password;
    }

    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="equipo_id" className="block text-sm font-medium text-slate-700">
          Equipo
        </label>
        <select
          id="equipo_id"
          required
          value={equipoId}
          onChange={(event) => setEquipoId(event.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        >
          <option value="" disabled>
            Selecciona un equipo
          </option>
          {equiposDisponibles.map((equipo) => (
            <option key={equipo.id} value={equipo.id}>
              {equipo.placa_sena}
            </option>
          ))}
        </select>
        {serverErrors?.equipo_id && <p className="mt-1 text-sm text-red-600">{serverErrors.equipo_id[0]}</p>}
      </div>

      <div>
        <label htmlFor="correo" className="block text-sm font-medium text-slate-700">
          Correo de la licencia
        </label>
        <input
          id="correo"
          type="email"
          required
          maxLength={150}
          value={correo}
          onChange={(event) => setCorreo(event.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        />
        {serverErrors?.correo && <p className="mt-1 text-sm text-red-600">{serverErrors.correo[0]}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Contraseña {esEdicion && '(dejar en blanco para no cambiarla)'}
        </label>
        <input
          id="password"
          type="password"
          required={!esEdicion}
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        />
        {serverErrors?.password && <p className="mt-1 text-sm text-red-600">{serverErrors.password[0]}</p>}
      </div>

      <div>
        <label htmlFor="estado_licencia" className="block text-sm font-medium text-slate-700">
          Estado
        </label>
        <select
          id="estado_licencia"
          required
          value={estadoLicencia}
          onChange={(event) => setEstadoLicencia(event.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        >
          {ESTADOS_LICENCIA.map((opcion) => (
            <option key={opcion.value} value={opcion.value}>
              {opcion.label}
            </option>
          ))}
        </select>
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
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
