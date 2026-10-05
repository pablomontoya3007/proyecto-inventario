import { useState } from 'react';
import { useSedes } from '../../sedes/hooks/useSedes';
import { useSubsedes } from '../../subsedes/hooks/useSubsedes';
import { useUbicaciones } from '../../ubicaciones/hooks/useUbicaciones';
import { BuscadorUsuario } from '../../usuarios/components/BuscadorUsuario';
import { useEquiposParaMasivo, useCreateMantenimientosMasivos } from '../hooks/useMantenimientos';

const CAMPO =
  'mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sena focus:outline-none disabled:bg-slate-100';

// Equipos en estos estados aparecen DESMARCADOS al cargar la ubicación,
// pero se pueden marcar a mano si hace falta.
const ESTADOS_SIN_PRESELECCION = ['de_baja', 'extraviado'];

function obtenerFechaHoyLocal() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function seleccionadoPorDefecto(equipo) {
  return !ESTADOS_SIN_PRESELECCION.includes(equipo.estado);
}

/**
 * Flujo: Sede → Subsede → Ubicación → lista de equipos (todos marcados
 * por defecto) → desmarcar los que no requieren mantenimiento → fecha,
 * usuario asignado y descripción → enviar.
 *
 * La selección se guarda como los CAMBIOS respecto a la selección por
 * defecto (Map id → true/false): así no hace falta un useEffect que la
 * "inicialice" cuando llegan los datos.
 *
 * Al terminar, el resultado se queda visible: cuántos se programaron,
 * cuáles se omitieron y si la notificación al usuario asignado salió.
 */
export function MantenimientoMasivoModal({ onClose }) {
  const [sedeId, setSedeId] = useState('');
  const [subsedeId, setSubsedeId] = useState('');
  const [ubicacionId, setUbicacionId] = useState('');
  const [cambios, setCambios] = useState(() => new Map());
  const [busqueda, setBusqueda] = useState('');
  const [fecha, setFecha] = useState(obtenerFechaHoyLocal);
  const [asignado, setAsignado] = useState(null);
  const [descripcion, setDescripcion] = useState('');

  const { data: sedesData } = useSedes(1);
  const { data: subsedesData } = useSubsedes({ page: 1, sedeId: sedeId || undefined });
  const { data: ubicacionesData } = useUbicaciones({ page: 1, subsedeId: subsedeId || undefined });
  const {
    data: equiposData,
    isLoading: cargandoEquipos,
    isError: errorEquipos,
  } = useEquiposParaMasivo(ubicacionId);
  const crear = useCreateMantenimientosMasivos();

  const equipos = equiposData ?? [];

  function estaSeleccionado(equipo) {
    if (equipo.tiene_mantenimiento_activo) return false;
    return cambios.has(equipo.id) ? cambios.get(equipo.id) : seleccionadoPorDefecto(equipo);
  }

  function marcar(ids, valor) {
    setCambios((anteriores) => {
      const siguientes = new Map(anteriores);
      ids.forEach((id) => siguientes.set(id, valor));
      return siguientes;
    });
  }

  function reiniciarSeleccion() {
    setCambios(new Map());
    setBusqueda('');
  }

  function handleSedeChange(event) {
    setSedeId(event.target.value);
    setSubsedeId('');
    setUbicacionId('');
    reiniciarSeleccion();
  }

  function handleSubsedeChange(event) {
    setSubsedeId(event.target.value);
    setUbicacionId('');
    reiniciarSeleccion();
  }

  function handleUbicacionChange(event) {
    setUbicacionId(event.target.value);
    reiniciarSeleccion();
  }

  const termino = busqueda.trim().toLowerCase();
  const equiposVisibles = termino
    ? equipos.filter((equipo) =>
        [equipo.placa_sena, equipo.serial, equipo.tipo_equipo].some((valor) =>
          String(valor ?? '').toLowerCase().includes(termino)
        )
      )
    : equipos;
  const idsVisiblesSeleccionables = equiposVisibles
    .filter((equipo) => !equipo.tiene_mantenimiento_activo)
    .map((equipo) => equipo.id);
  const idsSeleccionados = equipos.filter(estaSeleccionado).map((equipo) => equipo.id);
  const totalConPendiente = equipos.filter((equipo) => equipo.tiene_mantenimiento_activo).length;

  const serverErrors = crear.error?.response?.data?.errors;
  const errorEquipoIds = serverErrors
    ? Object.entries(serverErrors).find(([campo]) => campo.startsWith('equipo_ids'))?.[1]?.[0]
    : null;

  function handleSubmit(event) {
    event.preventDefault();
    if (idsSeleccionados.length === 0) return;

    crear.mutate({
      equipo_ids: idsSeleccionados,
      fecha_programada: fecha,
      descripcion: descripcion.trim() || null,
      asignado_a: asignado?.id ?? null,
    });
  }

  const resultado = crear.data;

  if (resultado) {
    const notificaciones = resultado.notificaciones ?? [];

    return (
      <div className="space-y-4">
        <div className="rounded border border-slate-200 bg-surface p-3 text-sm">
          <p className="font-medium text-sena-dark">{resultado.mensaje}</p>
          <p className="mt-1 text-slate-600">
            Ya aparecen en la pestaña Activos y en la hoja de vida de cada equipo.
          </p>

          {notificaciones.map((notificacion, indice) => (
            <p
              key={indice}
              className={`mt-3 rounded px-3 py-2 ${
                notificacion.estado === 'enviado' ? 'bg-sena-soft text-sena-dark' : 'bg-warning/20 text-ink'
              }`}
            >
              {notificacion.mensaje}
            </p>
          ))}

          {resultado.omitidos.length > 0 && (
            <>
              <p className="mt-3 font-medium text-warning">
                {resultado.omitidos.length} equipo(s) omitido(s):
              </p>
              <ul className="mt-1 max-h-40 space-y-1 overflow-y-auto">
                {resultado.omitidos.map((omitido) => (
                  <li key={omitido.equipo_id} className="text-slate-600">
                    <span className="font-mono">{omitido.placa_sena}</span>: {omitido.motivo}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="masivo_sede" className="block text-sm font-medium text-ink">
            Sede
          </label>
          <select id="masivo_sede" required value={sedeId} onChange={handleSedeChange} className={CAMPO}>
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
          <label htmlFor="masivo_subsede" className="block text-sm font-medium text-ink">
            Subsede
          </label>
          <select
            id="masivo_subsede"
            required
            disabled={!sedeId}
            value={subsedeId}
            onChange={handleSubsedeChange}
            className={CAMPO}
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
          <label htmlFor="masivo_ubicacion" className="block text-sm font-medium text-ink">
            Ubicación
          </label>
          <select
            id="masivo_ubicacion"
            required
            disabled={!subsedeId}
            value={ubicacionId}
            onChange={handleUbicacionChange}
            className={CAMPO}
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
        </div>
      </div>

      {ubicacionId && (
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink">
              Equipos de la ubicación
              {equipos.length > 0 && (
                <span className="ml-2 font-normal text-slate-500">
                  ({idsSeleccionados.length} de {equipos.length} seleccionados)
                </span>
              )}
            </h3>
            {equipos.length > 0 && (
              <div className="flex gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => marcar(idsVisiblesSeleccionables, true)}
                  className="font-medium text-sena hover:text-sena-dark"
                >
                  Marcar todos
                </button>
                <button
                  type="button"
                  onClick={() => marcar(idsVisiblesSeleccionables, false)}
                  className="font-medium text-slate-500 hover:text-ink"
                >
                  Desmarcar todos
                </button>
              </div>
            )}
          </div>

          {cargandoEquipos && <p className="text-sm text-slate-500">Cargando equipos...</p>}
          {errorEquipos && <p className="text-sm text-danger">No se pudieron cargar los equipos de esta ubicación.</p>}

          {!cargandoEquipos && !errorEquipos && equipos.length === 0 && (
            <p className="text-sm text-slate-500">Esta ubicación no tiene equipos registrados.</p>
          )}

          {equipos.length > 0 && (
            <>
              <input
                type="text"
                placeholder="Filtrar por placa, serial o tipo..."
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-sena focus:outline-none"
              />

              {totalConPendiente > 0 && (
                <p className="text-xs text-slate-500">
                  {totalConPendiente} equipo(s) ya tienen un mantenimiento pendiente y no se pueden seleccionar.
                </p>
              )}

              <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto rounded border border-slate-200">
                {equiposVisibles.length === 0 && (
                  <li className="px-3 py-2 text-sm text-slate-500">Ningún equipo coincide con el filtro.</li>
                )}
                {equiposVisibles.map((equipo) => {
                  const deshabilitado = equipo.tiene_mantenimiento_activo;
                  const checkboxId = `masivo-equipo-${equipo.id}`;

                  return (
                    <li
                      key={equipo.id}
                      className={`flex items-center gap-3 px-3 py-2 text-sm ${deshabilitado ? 'bg-slate-50' : ''}`}
                    >
                      <input
                        id={checkboxId}
                        type="checkbox"
                        checked={estaSeleccionado(equipo)}
                        disabled={deshabilitado}
                        onChange={(event) => marcar([equipo.id], event.target.checked)}
                        className="h-4 w-4 accent-sena"
                      />
                      <label
                        htmlFor={checkboxId}
                        className={`flex flex-1 flex-wrap items-baseline gap-x-3 ${
                          deshabilitado ? 'text-slate-400' : 'cursor-pointer'
                        }`}
                      >
                        <span className="font-mono text-ink">{equipo.placa_sena}</span>
                        <span className="text-slate-500">{equipo.tipo_equipo ?? 'Sin tipo'}</span>
                        <span className="text-xs text-slate-400">Serial: {equipo.serial}</span>
                      </label>
                      {deshabilitado ? (
                        <span className="text-xs text-warning">Ya tiene mantenimiento pendiente</span>
                      ) : (
                        ESTADOS_SIN_PRESELECCION.includes(equipo.estado) && (
                          <span className="text-xs text-slate-500">{equipo.estado_label}</span>
                        )
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {errorEquipoIds && <p className="text-sm text-danger">{errorEquipoIds}</p>}
        </section>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="masivo_fecha" className="block text-sm font-medium text-ink">
            Fecha del mantenimiento
          </label>
          <input
            id="masivo_fecha"
            type="date"
            required
            value={fecha}
            onChange={(event) => setFecha(event.target.value)}
            className={CAMPO}
          />
          {serverErrors?.fecha_programada && (
            <p className="mt-1 text-sm text-danger">{serverErrors.fecha_programada[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="masivo_asignado" className="block text-sm font-medium text-ink">
            Asignar a (opcional)
          </label>
          <BuscadorUsuario
            id="masivo_asignado"
            value={asignado}
            onChange={setAsignado}
            placeholder="Usuario que hará el mantenimiento..."
            className="mt-1"
            inputClassName="rounded border border-slate-300 px-3 py-2 text-sm focus:border-sena focus:outline-none"
          />
          {serverErrors?.asignado_a && <p className="mt-1 text-sm text-danger">{serverErrors.asignado_a[0]}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="masivo_descripcion" className="block text-sm font-medium text-ink">
          Descripción (opcional, se aplica a todos)
        </label>
        <textarea
          id="masivo_descripcion"
          maxLength={500}
          rows={2}
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          className={CAMPO}
        />
        {serverErrors?.descripcion && <p className="mt-1 text-sm text-danger">{serverErrors.descripcion[0]}</p>}
        <p className="mt-1 text-xs text-slate-500">
          {asignado
            ? `${asignado.nombre} quedará asignado a todos los mantenimientos y recibirá UN correo (${asignado.correo}) con la lista de equipos.`
            : 'Si asignas un usuario, recibirá UN correo con la lista de todos los equipos programados.'}
        </p>
      </div>

      {crear.isError && !serverErrors && (
        <p className="rounded bg-danger/10 px-3 py-2 text-sm text-danger">
          No se pudieron programar los mantenimientos. Intenta de nuevo.
        </p>
      )}

      <div className="flex justify-end gap-2 border-t pt-4">
        <button type="button" onClick={onClose} className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={idsSeleccionados.length === 0 || !fecha || crear.isPending}
          className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark disabled:opacity-50"
        >
          {crear.isPending
            ? 'Programando...'
            : `Programar ${idsSeleccionados.length} mantenimiento${idsSeleccionados.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </form>
  );
}