import { useState } from 'react';
import { EquipoAutocomplete } from '../../../shared/components/EquipoAutocomplete';
import { useVerificarLicencia } from '../hooks/useVerificarLicencia';

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
 * conserva la contraseña actual; escribir algo la reemplaza.
 *
 * El equipo se elige escribiendo su placa (EquipoAutocomplete). Al
 * elegirlo se verifica en vivo si ya tiene licencia (un equipo, una
 * licencia) y se bloquea "Guardar" si es así. El correo se verifica al
 * escribirlo: si ya está en otras licencias, solo se advierte (la BD lo
 * permite). El backend sigue validando de todas formas.
 */
export function LicenciaForm({ initialValues, onSubmit, onCancel, isSubmitting, serverErrors }) {
  const [equipo, setEquipo] = useState(initialValues?.equipo ?? null);
  const [falloEquipo, setFalloEquipo] = useState(false);
  const [correo, setCorreo] = useState(initialValues?.correo ?? '');
  const [password, setPassword] = useState('');
  const [estadoLicencia, setEstadoLicencia] = useState(initialValues?.estado_licencia ?? 'activa');

  const esEdicion = Boolean(initialValues?.id);

  const { licenciaDelEquipo, licenciasConCorreo, verificandoEquipo } = useVerificarLicencia({
    equipoId: equipo?.id,
    correo,
    ignorarId: initialValues?.id,
  });

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

    if (licenciaDelEquipo) return;

    const payload = {
      equipo_id: equipo.id,
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
        <label htmlFor="equipo_id" className="block text-sm font-medium text-ink">
          Equipo (escribe la placa SENA)
        </label>
        <div className="mt-1">
          <EquipoAutocomplete id="equipo_id" value={equipo} onChange={handleEquipoChange} />
        </div>
        {falloEquipo && !equipo && (
          <p className="mt-1 text-sm text-danger">Elige un equipo de la lista para poder guardar.</p>
        )}
        {verificandoEquipo && !licenciaDelEquipo && (
          <p className="mt-1 text-xs text-slate-400">Verificando si el equipo ya tiene licencia...</p>
        )}
        {licenciaDelEquipo && (
          <p className="mt-1 text-sm text-danger">
            Este equipo ya tiene una licencia asociada (correo {licenciaDelEquipo.correo}
            {licenciaDelEquipo.estado_label ? `, ${licenciaDelEquipo.estado_label.toLowerCase()}` : ''}). Edita esa
            licencia en vez de crear otra, o elige un equipo distinto.
          </p>
        )}
        {serverErrors?.equipo_id && <p className="mt-1 text-sm text-danger">{serverErrors.equipo_id[0]}</p>}
      </div>

      <div>
        <label htmlFor="correo" className="block text-sm font-medium text-ink">
          Correo de la licencia
        </label>
        <input
          id="correo"
          type="email"
          required
          maxLength={150}
          value={correo}
          onChange={(event) => setCorreo(event.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
        />
        {licenciasConCorreo.length > 0 && (
          <p className="mt-1 rounded bg-warning/20 px-3 py-2 text-xs text-ink">
            Este correo ya está asociado a {licenciasConCorreo.length === 1 ? 'la placa' : 'las placas'}{' '}
            <span className="font-mono">
              {licenciasConCorreo.map((licencia) => licencia.placa_sena ?? 'equipo eliminado').join(', ')}
            </span>
            . Puedes guardar igual si la cuenta se comparte entre equipos.
          </p>
        )}
        {serverErrors?.correo && <p className="mt-1 text-sm text-danger">{serverErrors.correo[0]}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-ink">
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
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
        />
        {serverErrors?.password && <p className="mt-1 text-sm text-danger">{serverErrors.password[0]}</p>}
      </div>

      <div>
        <label htmlFor="estado_licencia" className="block text-sm font-medium text-ink">
          Estado
        </label>
        <select
          id="estado_licencia"
          required
          value={estadoLicencia}
          onChange={(event) => setEstadoLicencia(event.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
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
          disabled={isSubmitting || Boolean(licenciaDelEquipo)}
          className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}