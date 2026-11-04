import { useState, useMemo } from 'react';
import { useTiposEquipo } from '../../tipos-equipo/hooks/useTiposEquipo';
import { useBuscarSedes } from '../../sedes/hooks/useSedes';
import { useBuscarSubsedes } from '../../subsedes/hooks/useSubsedes';
import { useBuscarUbicaciones } from '../../ubicaciones/hooks/useUbicaciones';
import { BuscadorResponsable } from '../../responsables/components/BuscadorResponsable';
import { BuscadorCatalogo } from '../../../shared/components/BuscadorCatalogo';
import { useVerificarEquipo } from '../hooks/useVerificarEquipo';
import { CaracteristicasEditor } from './CaracteristicasEditor';

// Confirmado contra app/Enums/EstadoEquipo.php — valores y etiquetas reales.
const ESTADOS_EQUIPO = [
  { value: 'activo', label: 'Activo' },
  { value: 'mantenimiento', label: 'En mantenimiento' },
  { value: 'de_baja', label: 'De baja' },
  { value: 'extraviado', label: 'Extraviado' },
];

const INPUT = 'rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none';
const INPUT_ERROR = 'rounded border border-danger px-3 py-2 focus:border-danger focus:outline-none';

/**
 * Aviso en vivo de placa o serial repetidos. Si el duplicado es un
 * equipo ELIMINADO, se explica aparte: su placa/serial siguen ocupados
 * en la BD y no se pueden reutilizar.
 */
function AvisoDuplicado({ campo, coincidencia }) {
  if (coincidencia.eliminado) {
    return (
      <p className="mt-1 text-sm text-danger">
        Ya existe un equipo <strong>eliminado</strong> con {campo === 'placa' ? 'esta placa' : 'este serial'}; no se
        puede reutilizar.
      </p>
    );
  }

  const detalle = [coincidencia.tipo_equipo, coincidencia.ubicacion].filter(Boolean).join(' · ');

  return (
    <p className="mt-1 text-sm text-danger">
      Ya existe un equipo con {campo === 'placa' ? 'esta placa' : 'este serial'}
      {campo === 'serial' && (
        <>
          {' '}
          (placa <span className="font-mono">{coincidencia.placa_sena}</span>)
        </>
      )}
      {detalle && `: ${detalle}`}.
    </p>
  );
}

/**
 * Placa SENA, serial y MAC no tienen formato obligatorio: la
 * institución maneja muchas variaciones según el equipo. El backend
 * (NormalizadorEquipo) convierte números a texto y, cuando lo escrito
 * tiene forma de MAC, la guarda como AA:BB:CC:DD:EE:FF.
 *
 * Mientras se escribe la placa o el serial, se verifica en vivo si ya
 * existen (useVerificarEquipo) y se bloquea "Guardar" si hay duplicado,
 * sin tener que intentar guardar primero. El backend sigue validando.
 *
 * El responsable se elige con BuscadorResponsable (autocompletado
 * contra el backend), porque hay demasiados para un <select>.
 *
 * Sede / Subsede / Ubicación usan BuscadorCatalogo (autocompletado
 * contra el backend), en cascada: cada nivel depende del anterior y
 * cambiar uno limpia los de abajo. Ya no hay límite de 15 registros:
 * se escribe parte del nombre y el servidor devuelve las coincidencias.
 * El estado guarda el objeto { id, nombre } de cada nivel.
 */
export function EquipoForm({ initialValues, onSubmit, onCancel, isSubmitting, serverErrors }) {
  const ubicacionInicial = initialValues?.ubicacion_formacion ?? null;

  const [placaSena, setPlacaSena] = useState(String(initialValues?.placa_sena ?? ''));
  const [serial, setSerial] = useState(String(initialValues?.serial ?? ''));
  const [mac, setMac] = useState(initialValues?.mac ?? '');
  const [macCableada, setMacCableada] = useState(initialValues?.mac_cableada ?? '');
  const [hostname, setHostname] = useState(initialValues?.hostname ?? '');
  const [tipoEquipoId, setTipoEquipoId] = useState(initialValues?.tipo_equipo?.id ?? '');
  const [responsable, setResponsable] = useState(initialValues?.responsable ?? null);
  const [sede, setSede] = useState(ubicacionInicial?.subsede?.sede ?? null);
  const [subsede, setSubsede] = useState(ubicacionInicial?.subsede ?? null);
  const [ubicacion, setUbicacion] = useState(ubicacionInicial);
  const [caracteristicas, setCaracteristicas] = useState(initialValues?.caracteristicas_tecnicas ?? {});
  const [estado, setEstado] = useState(initialValues?.estado ?? 'activo');

  const { data: tiposData } = useTiposEquipo();

  const { duplicadoPlaca, duplicadoSerial, verificandoPlaca, verificandoSerial } = useVerificarEquipo({
    placa: placaSena,
    serial,
    ignorarId: initialValues?.id,
  });
  const hayDuplicado = Boolean(duplicadoPlaca || duplicadoSerial);

  // Solo tipos activos para elegir, salvo que el equipo que se edita ya
  // tenga asignado uno inactivo — ahí se deja visible para no "perder"
  // la selección actual al abrir el formulario.
  const tiposDisponibles = useMemo(() => {
    if (!tiposData) return [];
    const activos = tiposData.filter((t) => t.activo);
    const actual = initialValues?.tipo_equipo;
    if (actual && !activos.some((t) => t.id === actual.id)) {
      return [...activos, actual];
    }
    return activos;
  }, [tiposData, initialValues]);

  const tipoSeleccionado = tiposDisponibles.find((t) => t.id === Number(tipoEquipoId));

  // Cambiar un nivel invalida los de abajo (una subsede de otra sede ya
  // no es válida).
  function handleSedeChange(nuevaSede) {
    setSede(nuevaSede);
    setSubsede(null);
    setUbicacion(null);
  }

  function handleSubsedeChange(nuevaSubsede) {
    setSubsede(nuevaSubsede);
    setUbicacion(null);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (hayDuplicado || !ubicacion) return;

    onSubmit({
      placa_sena: placaSena,
      serial,
      mac: mac.trim() || null,
      mac_cableada: macCableada.trim() || null,
      hostname: hostname.trim() || null,
      tipo_equipo_id: Number(tipoEquipoId),
      responsable_id: responsable?.id ?? null,
      ubicacion_formacion_id: ubicacion.id,
      estado,
      caracteristicas_tecnicas: caracteristicas,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="placa_sena" className="block text-sm font-medium text-ink">
            Placa SENA
          </label>
          <input
            id="placa_sena"
            type="text"
            required
            maxLength={30}
            value={placaSena}
            onChange={(event) => setPlacaSena(event.target.value)}
            aria-invalid={Boolean(duplicadoPlaca)}
            className={`mt-1 w-full ${duplicadoPlaca ? INPUT_ERROR : INPUT}`}
          />
          {verificandoPlaca && <p className="mt-1 text-xs text-slate-400">Verificando placa...</p>}
          {duplicadoPlaca && <AvisoDuplicado campo="placa" coincidencia={duplicadoPlaca} />}
          {serverErrors?.placa_sena && <p className="mt-1 text-sm text-danger">{serverErrors.placa_sena[0]}</p>}
        </div>

        <div>
          <label htmlFor="serial" className="block text-sm font-medium text-ink">
            Serial
          </label>
          <input
            id="serial"
            type="text"
            required
            maxLength={100}
            value={serial}
            onChange={(event) => setSerial(event.target.value)}
            aria-invalid={Boolean(duplicadoSerial)}
            className={`mt-1 w-full ${duplicadoSerial ? INPUT_ERROR : INPUT}`}
          />
          {verificandoSerial && <p className="mt-1 text-xs text-slate-400">Verificando serial...</p>}
          {duplicadoSerial && <AvisoDuplicado campo="serial" coincidencia={duplicadoSerial} />}
          {serverErrors?.serial && <p className="mt-1 text-sm text-danger">{serverErrors.serial[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="mac" className="block text-sm font-medium text-ink">
            MAC (inalámbrica, opcional)
          </label>
          <input
            id="mac"
            type="text"
            maxLength={50}
            placeholder="Cualquier formato"
            value={mac}
            onChange={(event) => setMac(event.target.value)}
            className={`mt-1 w-full ${INPUT}`}
          />
          {serverErrors?.mac && <p className="mt-1 text-sm text-danger">{serverErrors.mac[0]}</p>}
        </div>

        <div>
          <label htmlFor="mac_cableada" className="block text-sm font-medium text-ink">
            MAC (cableada, opcional)
          </label>
          <input
            id="mac_cableada"
            type="text"
            maxLength={50}
            placeholder="Cualquier formato"
            value={macCableada}
            onChange={(event) => setMacCableada(event.target.value)}
            className={`mt-1 w-full ${INPUT}`}
          />
          {serverErrors?.mac_cableada && <p className="mt-1 text-sm text-danger">{serverErrors.mac_cableada[0]}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="hostname" className="block text-sm font-medium text-ink">
          Hostname (opcional)
        </label>
        <input
          id="hostname"
          type="text"
          maxLength={100}
          value={hostname}
          onChange={(event) => setHostname(event.target.value)}
          className={`mt-1 w-full ${INPUT}`}
        />
        {serverErrors?.hostname && <p className="mt-1 text-sm text-danger">{serverErrors.hostname[0]}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="tipo_equipo_id" className="block text-sm font-medium text-ink">
            Tipo de equipo
          </label>
          <select
            id="tipo_equipo_id"
            required
            value={tipoEquipoId}
            onChange={(event) => setTipoEquipoId(event.target.value)}
            className={`mt-1 w-full ${INPUT}`}
          >
            <option value="" disabled>
              Selecciona un tipo
            </option>
            {tiposDisponibles.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
          {serverErrors?.tipo_equipo_id && (
            <p className="mt-1 text-sm text-danger">{serverErrors.tipo_equipo_id[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="responsable_buscador" className="block text-sm font-medium text-ink">
            Responsable (opcional)
          </label>
          <BuscadorResponsable
            id="responsable_buscador"
            value={responsable}
            onChange={setResponsable}
            placeholder="Nombre o documento..."
            className="mt-1"
            inputClassName={INPUT}
          />
          {!responsable && <p className="mt-1 text-xs text-slate-500">Vacío = sin asignar</p>}
          {serverErrors?.responsable_id && (
            <p className="mt-1 text-sm text-danger">{serverErrors.responsable_id[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-ink">
            Estado
          </label>
          <select
            id="estado"
            required
            value={estado}
            onChange={(event) => setEstado(event.target.value)}
            className={`mt-1 w-full ${INPUT}`}
          >
            {ESTADOS_EQUIPO.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
          {serverErrors?.estado && <p className="mt-1 text-sm text-danger">{serverErrors.estado[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="sede_id_equipo" className="block text-sm font-medium text-ink">
            Sede
          </label>
          <BuscadorCatalogo
            id="sede_id_equipo"
            value={sede}
            onChange={handleSedeChange}
            useBuscar={useBuscarSedes}
            placeholder="Buscar sede..."
            className="mt-1"
            inputClassName={INPUT}
          />
        </div>

        <div>
          <label htmlFor="subsede_id_equipo" className="block text-sm font-medium text-ink">
            Subsede
          </label>
          <BuscadorCatalogo
            id="subsede_id_equipo"
            value={subsede}
            onChange={handleSubsedeChange}
            useBuscar={useBuscarSubsedes}
            parametros={{ sedeId: sede?.id }}
            disabled={!sede}
            placeholder={sede ? 'Buscar subsede...' : 'Primero elige una sede'}
            className="mt-1"
            inputClassName={`${INPUT} disabled:bg-slate-100`}
          />
        </div>

        <div>
          <label htmlFor="ubicacion_formacion_id" className="block text-sm font-medium text-ink">
            Ubicación
          </label>
          <BuscadorCatalogo
            id="ubicacion_formacion_id"
            value={ubicacion}
            onChange={setUbicacion}
            useBuscar={useBuscarUbicaciones}
            parametros={{ subsedeId: subsede?.id }}
            disabled={!subsede}
            placeholder={subsede ? 'Buscar ubicación...' : 'Primero elige una subsede'}
            className="mt-1"
            inputClassName={`${INPUT} disabled:bg-slate-100`}
          />
          {serverErrors?.ubicacion_formacion_id && (
            <p className="mt-1 text-sm text-danger">{serverErrors.ubicacion_formacion_id[0]}</p>
          )}
        </div>
      </div>

      <CaracteristicasEditor
        key={initialValues?.id ?? 'nuevo'}
        value={caracteristicas}
        onChange={setCaracteristicas}
        tipoNombre={tipoSeleccionado?.nombre}
        error={serverErrors?.caracteristicas_tecnicas?.[0]}
      />

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        {hayDuplicado && (
          <p className="mr-auto text-sm text-danger">Corrige la placa o el serial repetido para poder guardar.</p>
        )}
        {!hayDuplicado && !ubicacion && (
          <p className="mr-auto text-sm text-slate-500">Elige sede, subsede y ubicación de la lista para poder guardar.</p>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || hayDuplicado || !ubicacion}
          className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}