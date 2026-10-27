import { useState } from 'react';
import { useSedes } from '../../sedes/hooks/useSedes';
import { useSubsedes } from '../../subsedes/hooks/useSubsedes';
import { useUbicaciones } from '../../ubicaciones/hooks/useUbicaciones';
import { BuscadorUsuario } from '../../usuarios/components/BuscadorUsuario';
import { useEquiposParaNovedadMasiva, useCreateNovedadMasiva } from '../hooks/useNovedades';

const CAMPO =
    'mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sena focus:outline-none disabled:bg-slate-100';

/**
 * Agrupa los equipos marcados por cuentadante, para mostrar ANTES de
 * guardar a quién le llegará correo (uno por cuentadante, con sus
 * equipos) y a quién no (sin correo o equipos sin cuentadante).
 */
function resumirCuentadantes(equipos, correoAsignado) {
    const conCorreo = new Map();
    let sinCorreo = 0;
    let sinCuentadante = 0;

    equipos.forEach((equipo) => {
        const responsable = equipo.responsable;
        if (!responsable) {
            sinCuentadante += 1;
        } else if (!responsable.correo) {
            sinCorreo += 1;
        } else if (responsable.correo.toLowerCase() !== correoAsignado) {
            const actual = conCorreo.get(responsable.id) ?? { nombre: responsable.nombre, cantidad: 0 };
            conCorreo.set(responsable.id, { ...actual, cantidad: actual.cantidad + 1 });
        }
    });

    return { conCorreo: [...conCorreo.values()], sinCorreo, sinCuentadante };
}

/**
 * Novedad masiva: la MISMA novedad en varios equipos de un ambiente.
 *
 * Flujo: Sede → Subsede → Ambiente → marcar los equipos donde se presenta
 * la novedad → usuario asignado (opcional) y descripción → registrar.
 *
 * Se crea una novedad por equipo (cada una se resuelve por separado y
 * aparece en la hoja de vida de su equipo), pero el usuario asignado
 * recibe UN solo correo con todos los equipos, y cada cuentadante UNO
 * con los suyos.
 *
 * A diferencia del mantenimiento masivo, aquí los equipos empiezan
 * DESMARCADOS: normalmente la novedad afecta solo a algunos del ambiente.
 */
export function NovedadMasivaModal({ onClose }) {
    const [sedeId, setSedeId] = useState('');
    const [subsedeId, setSubsedeId] = useState('');
    const [ubicacionId, setUbicacionId] = useState('');
    const [seleccionados, setSeleccionados] = useState(() => new Set());
    const [busqueda, setBusqueda] = useState('');
    const [asignado, setAsignado] = useState(null);
    const [descripcion, setDescripcion] = useState('');

    const { data: sedesData } = useSedes(1);
    const { data: subsedesData } = useSubsedes({ page: 1, sedeId: sedeId || undefined });
    const { data: ubicacionesData } = useUbicaciones({ page: 1, subsedeId: subsedeId || undefined });
    const { data: equiposData, isLoading: cargandoEquipos, isError: errorEquipos } = useEquiposParaNovedadMasiva(ubicacionId);
    const crear = useCreateNovedadMasiva();

    const equipos = equiposData ?? [];

    function reiniciarSeleccion() {
        setSeleccionados(new Set());
        setBusqueda('');
    }

    function marcar(ids, valor) {
        setSeleccionados((anteriores) => {
            const siguientes = new Set(anteriores);
            ids.forEach((id) => (valor ? siguientes.add(id) : siguientes.delete(id)));
            return siguientes;
        });
    }

    const termino = busqueda.trim().toLowerCase();
    const equiposVisibles = termino
        ? equipos.filter((equipo) =>
              [equipo.placa_sena, equipo.serial, equipo.tipo_equipo, equipo.responsable?.nombre].some((valor) =>
                  String(valor ?? '').toLowerCase().includes(termino)
              )
          )
        : equipos;
    const equiposMarcados = equipos.filter((equipo) => seleccionados.has(equipo.id));

    const correoAsignado = asignado?.correo?.toLowerCase() ?? null;
    const resumen = resumirCuentadantes(equiposMarcados, correoAsignado);

    const serverErrors = crear.error?.response?.data?.errors;
    const errorEquipoIds = serverErrors
        ? Object.entries(serverErrors).find(([campo]) => campo.startsWith('equipo_ids'))?.[1]?.[0]
        : null;

    function handleSubmit(event) {
        event.preventDefault();
        if (equiposMarcados.length === 0) return;

        crear.mutate({
            equipo_ids: equiposMarcados.map((equipo) => equipo.id),
            descripcion: descripcion.trim(),
            asignado_a: asignado?.id ?? null,
        });
    }

    const resultado = crear.data;

    if (resultado) {
        return (
            <div className="space-y-4">
                <div className="rounded border border-slate-200 bg-surface p-3 text-sm">
                    <p className="font-medium text-sena-dark">{resultado.mensaje}</p>
                    <p className="mt-1 text-slate-600">
                        Cada equipo quedó con su propia novedad: aparecen en el listado, en la hoja de vida de cada
                        equipo y se resuelven por separado.
                    </p>

                    {(resultado.notificaciones ?? []).map((notificacion, indice) => (
                        <p
                            key={indice}
                            className={`mt-3 rounded px-3 py-2 ${
                                notificacion.estado === 'enviado' ? 'bg-sena-soft text-sena-dark' : 'bg-warning/20 text-ink'
                            }`}
                        >
                            {notificacion.mensaje}
                        </p>
                    ))}
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
                    <label htmlFor="novedad_masiva_sede" className="block text-sm font-medium text-ink">
                        Sede
                    </label>
                    <select
                        id="novedad_masiva_sede"
                        required
                        value={sedeId}
                        onChange={(event) => {
                            setSedeId(event.target.value);
                            setSubsedeId('');
                            setUbicacionId('');
                            reiniciarSeleccion();
                        }}
                        className={CAMPO}
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
                    <label htmlFor="novedad_masiva_subsede" className="block text-sm font-medium text-ink">
                        Subsede
                    </label>
                    <select
                        id="novedad_masiva_subsede"
                        required
                        disabled={!sedeId}
                        value={subsedeId}
                        onChange={(event) => {
                            setSubsedeId(event.target.value);
                            setUbicacionId('');
                            reiniciarSeleccion();
                        }}
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
                    <label htmlFor="novedad_masiva_ubicacion" className="block text-sm font-medium text-ink">
                        Ambiente
                    </label>
                    <select
                        id="novedad_masiva_ubicacion"
                        required
                        disabled={!subsedeId}
                        value={ubicacionId}
                        onChange={(event) => {
                            setUbicacionId(event.target.value);
                            reiniciarSeleccion();
                        }}
                        className={CAMPO}
                    >
                        <option value="" disabled>
                            Ambiente
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
                            ¿En qué equipos se presenta la novedad?
                            {equipos.length > 0 && (
                                <span className="ml-2 font-normal text-slate-500">
                                    ({equiposMarcados.length} de {equipos.length} seleccionados)
                                </span>
                            )}
                        </h3>
                        {equipos.length > 0 && (
                            <div className="flex gap-3 text-sm">
                                <button
                                    type="button"
                                    onClick={() => marcar(equiposVisibles.map((equipo) => equipo.id), true)}
                                    className="font-medium text-sena hover:text-sena-dark"
                                >
                                    Marcar todos
                                </button>
                                <button
                                    type="button"
                                    onClick={() => marcar(equiposVisibles.map((equipo) => equipo.id), false)}
                                    className="font-medium text-slate-500 hover:text-ink"
                                >
                                    Desmarcar todos
                                </button>
                            </div>
                        )}
                    </div>

                    {cargandoEquipos && <p className="text-sm text-slate-500">Cargando equipos...</p>}
                    {errorEquipos && (
                        <p className="text-sm text-danger">No se pudieron cargar los equipos de este ambiente.</p>
                    )}
                    {!cargandoEquipos && !errorEquipos && equipos.length === 0 && (
                        <p className="text-sm text-slate-500">Este ambiente no tiene equipos registrados.</p>
                    )}

                    {equipos.length > 0 && (
                        <>
                            <input
                                type="text"
                                placeholder="Filtrar por placa, serial, tipo o cuentadante..."
                                value={busqueda}
                                onChange={(event) => setBusqueda(event.target.value)}
                                className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-sena focus:outline-none"
                            />

                            <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto rounded border border-slate-200">
                                {equiposVisibles.length === 0 && (
                                    <li className="px-3 py-2 text-sm text-slate-500">Ningún equipo coincide con el filtro.</li>
                                )}
                                {equiposVisibles.map((equipo) => {
                                    const checkboxId = `novedad-masiva-equipo-${equipo.id}`;

                                    return (
                                        <li key={equipo.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                                            <input
                                                id={checkboxId}
                                                type="checkbox"
                                                checked={seleccionados.has(equipo.id)}
                                                onChange={(event) => marcar([equipo.id], event.target.checked)}
                                                className="h-4 w-4 accent-sena"
                                            />
                                            <label
                                                htmlFor={checkboxId}
                                                className="flex flex-1 cursor-pointer flex-wrap items-baseline gap-x-3"
                                            >
                                                <span className="font-mono text-ink">{equipo.placa_sena}</span>
                                                <span className="text-slate-500">{equipo.tipo_equipo ?? 'Sin tipo'}</span>
                                                <span className="text-xs text-slate-400">
                                                    {equipo.responsable?.nombre ?? 'Sin cuentadante'}
                                                </span>
                                            </label>
                                            {equipo.novedades_abiertas_count > 0 && (
                                                <span
                                                    className="rounded-full bg-warning/20 px-2 py-0.5 text-xs text-ink"
                                                    title="Ya tiene novedades abiertas; igual puedes registrarle esta"
                                                >
                                                    {equipo.novedades_abiertas_count} abierta(s)
                                                </span>
                                            )}
                                            {['de_baja', 'extraviado'].includes(equipo.estado) && (
                                                <span className="text-xs text-slate-500">{equipo.estado_label}</span>
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

            <div>
                <label htmlFor="novedad_masiva_asignado" className="block text-sm font-medium text-ink">
                    Asignar revisión a (opcional)
                </label>
                <BuscadorUsuario
                    id="novedad_masiva_asignado"
                    value={asignado}
                    onChange={setAsignado}
                    placeholder="Usuario que revisará las novedades..."
                    className="mt-1"
                    inputClassName="rounded border border-slate-300 px-3 py-2 text-sm focus:border-sena focus:outline-none"
                />
                {serverErrors?.asignado_a && <p className="mt-1 text-sm text-danger">{serverErrors.asignado_a[0]}</p>}
            </div>

            <div>
                <label htmlFor="novedad_masiva_descripcion" className="block text-sm font-medium text-ink">
                    Descripción de la novedad (se aplica a todos los equipos marcados)
                </label>
                <textarea
                    id="novedad_masiva_descripcion"
                    required
                    minLength={5}
                    maxLength={2000}
                    rows={4}
                    value={descripcion}
                    onChange={(event) => setDescripcion(event.target.value)}
                    placeholder="Ej. Los equipos no tienen conexión a internet desde esta mañana."
                    className={CAMPO}
                />
                {serverErrors?.descripcion && <p className="mt-1 text-sm text-danger">{serverErrors.descripcion[0]}</p>}
            </div>

            {equiposMarcados.length > 0 && (
                <div className="rounded border border-slate-200 bg-surface px-3 py-2 text-xs text-slate-600">
                    <p className="font-medium text-ink">Correos que se enviarán:</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5">
                        {asignado ? (
                            <li>
                                1 a {asignado.nombre} ({asignado.correo}) con los {equiposMarcados.length} equipo(s).
                            </li>
                        ) : (
                            <li>Ninguno de asignación: no elegiste a quién asignar la revisión.</li>
                        )}
                        {resumen.conCorreo.map((cuentadante) => (
                            <li key={cuentadante.nombre}>
                                1 al cuentadante {cuentadante.nombre} con sus {cuentadante.cantidad} equipo(s).
                            </li>
                        ))}
                        {resumen.sinCorreo > 0 && (
                            <li className="text-warning">
                                {resumen.sinCorreo} equipo(s) tienen un cuentadante sin correo registrado: no se le avisará.
                            </li>
                        )}
                        {resumen.sinCuentadante > 0 && (
                            <li className="text-warning">{resumen.sinCuentadante} equipo(s) no tienen cuentadante.</li>
                        )}
                    </ul>
                </div>
            )}

            {crear.isError && !serverErrors && (
                <p className="rounded bg-danger/10 px-3 py-2 text-sm text-danger">
                    No se pudieron registrar las novedades. Intenta de nuevo.
                </p>
            )}

            <div className="flex justify-end gap-2 border-t pt-4">
                <button type="button" onClick={onClose} className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={equiposMarcados.length === 0 || descripcion.trim().length < 5 || crear.isPending}
                    className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark disabled:opacity-50"
                >
                    {crear.isPending
                        ? 'Registrando...'
                        : `Registrar novedad en ${equiposMarcados.length} equipo${equiposMarcados.length === 1 ? '' : 's'}`}
                </button>
            </div>
        </form>
    );
}