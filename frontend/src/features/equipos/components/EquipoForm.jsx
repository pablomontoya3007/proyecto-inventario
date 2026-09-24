import { useState, useMemo } from 'react';
import { useTiposEquipo } from '../../tipos-equipo/hooks/useTiposEquipo';
import { useResponsables } from '../../responsables/hooks/useResponsables';
import { useSedes } from '../../sedes/hooks/useSedes';
import { useSubsedes } from '../../subsedes/hooks/useSubsedes';
import { useUbicaciones } from '../../ubicaciones/hooks/useUbicaciones';
import { CaracteristicasEditor } from './CaracteristicasEditor';

const FORMATO_MAC = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

// Confirmado contra app/Enums/EstadoEquipo.php — valores y etiquetas reales.
const ESTADOS_EQUIPO = [
  { value: 'activo', label: 'Activo' },
  { value: 'mantenimiento', label: 'En mantenimiento' },
  { value: 'de_baja', label: 'De baja' },
  { value: 'extraviado', label: 'Extraviado' },
];

/**
 * Sedes/Subsedes/Ubicaciones se listan sin paginar más allá de la
 * página 1 (máx. 15 cada una), igual que en los módulos anteriores. Si
 * este proyecto llega a superar esos 15 en algún nivel, un equipo ya
 * asignado a algo fuera de esa página no se va a ver seleccionado
 * correctamente al editar — lo dejo como límite conocido por ahora
 * (Responsables sí lo cubrí abajo, porque es mucho más probable que
 * superen los 15 en una institución real).
 */
export function EquipoForm({ initialValues, onSubmit, onCancel, isSubmitting, serverErrors }) {
  const [placaSena, setPlacaSena] = useState(initialValues?.placa_sena ?? '');
  const [serial, setSerial] = useState(initialValues?.serial ?? '');
  const [mac, setMac] = useState(initialValues?.mac ?? '');
  const [macCableada, setMacCableada] = useState(initialValues?.mac_cableada ?? '');
  const [hostname, setHostname] = useState(initialValues?.hostname ?? '');
  const [tipoEquipoId, setTipoEquipoId] = useState(initialValues?.tipo_equipo?.id ?? '');
  const [responsableId, setResponsableId] = useState(initialValues?.responsable?.id ?? '');
  const [sedeId, setSedeId] = useState(initialValues?.ubicacion_formacion?.subsede?.sede?.id ?? '');
  const [subsedeId, setSubsedeId] = useState(initialValues?.ubicacion_formacion?.subsede?.id ?? '');
  const [ubicacionId, setUbicacionId] = useState(initialValues?.ubicacion_formacion?.id ?? '');
  const [caracteristicas, setCaracteristicas] = useState(initialValues?.caracteristicas_tecnicas ?? {});
  // 'activo' como default sensato para equipos nuevos; al editar, parte
  // del valor real que ya tenga (initialValues.estado — el string crudo
  // del enum, no estado_label, que es solo para mostrar en la tabla).
  const [estado, setEstado] = useState(initialValues?.estado ?? 'activo');

  const { data: tiposData } = useTiposEquipo();
  const { data: responsablesData } = useResponsables({ page: 1 });
  const { data: sedesData } = useSedes(1);
  const { data: subsedesData } = useSubsedes({ page: 1, sedeId: sedeId || undefined });
  const { data: ubicacionesData } = useUbicaciones({ page: 1, subsedeId: subsedeId || undefined });

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

  // Mismo motivo: si el responsable ya asignado no cae en la primera
  // página (15), se agrega igual para que el <select> no lo muestre
  // como "sin asignar" por error.
  const responsablesDisponibles = useMemo(() => {
    const lista = responsablesData?.data ?? [];
    const actual = initialValues?.responsable;
    if (actual && !lista.some((r) => r.id === actual.id)) {
      return [...lista, actual];
    }
    return lista;
  }, [responsablesData, initialValues]);

  const tipoSeleccionado = tiposDisponibles.find((t) => t.id === Number(tipoEquipoId));

  const macInvalida = mac.trim() !== '' && !FORMATO_MAC.test(mac);
  const macCableadaInvalida = macCableada.trim() !== '' && !FORMATO_MAC.test(macCableada);

  function handleSedeChange(event) {
    setSedeId(event.target.value);
    setSubsedeId('');
    setUbicacionId('');
  }

  function handleSubsedeChange(event) {
    setSubsedeId(event.target.value);
    setUbicacionId('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      placa_sena: placaSena,
      serial,
      mac: mac.trim() || null,
      mac_cableada: macCableada.trim() || null,
      hostname: hostname.trim() || null,
      tipo_equipo_id: Number(tipoEquipoId),
      responsable_id: responsableId ? Number(responsableId) : null,
      ubicacion_formacion_id: Number(ubicacionId),
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
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
          />
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
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
          />
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
            placeholder="AA:BB:CC:DD:EE:FF"
            value={mac}
            onChange={(event) => setMac(event.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
          />
          {macInvalida && <p className="mt-1 text-sm text-amber-600">Formato esperado: AA:BB:CC:DD:EE:FF</p>}
          {serverErrors?.mac && <p className="mt-1 text-sm text-danger">{serverErrors.mac[0]}</p>}
        </div>

        <div>
          <label htmlFor="mac_cableada" className="block text-sm font-medium text-ink">
            MAC (cableada, opcional)
          </label>
          <input
            id="mac_cableada"
            type="text"
            placeholder="AA:BB:CC:DD:EE:FF"
            value={macCableada}
            onChange={(event) => setMacCableada(event.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
          />
          {macCableadaInvalida && <p className="mt-1 text-sm text-amber-600">Formato esperado: AA:BB:CC:DD:EE:FF</p>}
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
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
        />
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
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
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
          <label htmlFor="responsable_id" className="block text-sm font-medium text-ink">
            Responsable (opcional)
          </label>
          <select
            id="responsable_id"
            value={responsableId}
            onChange={(event) => setResponsableId(event.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
          >
            <option value="">Sin asignar</option>
            {responsablesDisponibles.map((responsable) => (
              <option key={responsable.id} value={responsable.id}>
                {responsable.nombre}
              </option>
            ))}
          </select>
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
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
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
          <select
            id="sede_id_equipo"
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
          <label htmlFor="subsede_id_equipo" className="block text-sm font-medium text-ink">
            Subsede
          </label>
          <select
            id="subsede_id_equipo"
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
          <label htmlFor="ubicacion_formacion_id" className="block text-sm font-medium text-ink">
            Ubicación
          </label>
          <select
            id="ubicacion_formacion_id"
            required
            disabled={!subsedeId}
            value={ubicacionId}
            onChange={(event) => setUbicacionId(event.target.value)}
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
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}