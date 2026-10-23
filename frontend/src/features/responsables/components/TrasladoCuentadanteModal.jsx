import { useState } from 'react';
import { useEquiposParaTraslado, useTrasladarCuentadantes } from '../hooks/useResponsables';
import { BuscadorResponsable } from './BuscadorResponsable';
import { useValorDiferido } from '../../../shared/hooks/useValorDiferido';

// Copia del objeto sin la clave `id` (sin mutar el original).
function sinClave(objeto, id) {
    const copia = { ...objeto };
    delete copia[id];
    return copia;
}

const CAMPO =
    'rounded border border-slate-300 px-2 py-1 text-sm focus:border-sena focus:outline-none focus:ring-1 focus:ring-sena';

/**
 * Traslado de cuentadantes: cambiar el cuentadante de uno o varios
 * equipos a otro cuentadante YA registrado. No crea historial propio
 * (solo actualiza el equipo); el cambio queda en la Auditoría general.
 *
 * Dos pasos en la misma pantalla:
 * 1. Elegir los equipos: se buscan por placa/serial/hostname, por su
 *    cuentadante actual o "sin cuentadante", y se marcan. Los marcados
 *    se conservan aunque se cambie la búsqueda (así se pueden juntar
 *    equipos de varias búsquedas).
 * 2. Elegir el nuevo cuentadante: uno "para todos" (traslado masivo) y,
 *    si hace falta, uno distinto en cualquier fila (uno por uno). Lo que
 *    se elija en una fila manda sobre el "para todos".
 *
 * origenInicial: si se abre desde la fila de un cuentadante, arranca
 * mostrando sus equipos.
 */
export function TrasladoCuentadanteModal({ origenInicial = null, onClose }) {
    const [origen, setOrigen] = useState(origenInicial);
    const [texto, setTexto] = useState('');
    const [sinCuentadante, setSinCuentadante] = useState(false);

    const [seleccionados, setSeleccionados] = useState([]); // objetos equipo, en orden de selección
    const [nuevoGeneral, setNuevoGeneral] = useState(null);
    const [individuales, setIndividuales] = useState({}); // equipoId -> responsable
    const [confirmando, setConfirmando] = useState(false);

    const buscar = useValorDiferido(texto.trim(), 300);
    const resultados = useEquiposParaTraslado({
        buscar,
        responsableId: sinCuentadante ? null : origen?.id,
        sinCuentadante,
    });
    const trasladar = useTrasladarCuentadantes();

    const hayCriterio = Boolean(buscar || origen || sinCuentadante);
    const encontrados = hayCriterio ? (resultados.data?.data ?? []) : [];
    const idsSeleccionados = new Set(seleccionados.map((equipo) => equipo.id));
    const todosMarcados = encontrados.length > 0 && encontrados.every((equipo) => idsSeleccionados.has(equipo.id));

    // Cuentadante que recibirá cada equipo: el de su fila o, si no, el general.
    const destinoDe = (equipo) => individuales[equipo.id] ?? nuevoGeneral;

    const sinDestino = seleccionados.filter((equipo) => !destinoDe(equipo));
    const aCambiar = seleccionados.filter((equipo) => destinoDe(equipo) && destinoDe(equipo).id !== equipo.responsable?.id);
    const puedeEnviar = seleccionados.length > 0 && sinDestino.length === 0 && aCambiar.length > 0;

    function alternar(equipo) {
        setConfirmando(false);
        if (idsSeleccionados.has(equipo.id)) {
            quitar(equipo.id);
        } else {
            setSeleccionados((actuales) => [...actuales, equipo]);
        }
    }

    function alternarTodos() {
        setConfirmando(false);
        if (todosMarcados) {
            const visibles = new Set(encontrados.map((equipo) => equipo.id));
            setSeleccionados((actuales) => actuales.filter((equipo) => !visibles.has(equipo.id)));
        } else {
            setSeleccionados((actuales) => [...actuales, ...encontrados.filter((equipo) => !idsSeleccionados.has(equipo.id))]);
        }
    }

    function quitar(id) {
        setConfirmando(false);
        setSeleccionados((actuales) => actuales.filter((equipo) => equipo.id !== id));
        setIndividuales((actuales) => sinClave(actuales, id));
    }

    function cambiarIndividual(id, responsable) {
        setConfirmando(false);
        setIndividuales((actuales) => (responsable ? { ...actuales, [id]: responsable } : sinClave(actuales, id)));
    }

    function enviar() {
        trasladar.mutate(
            seleccionados.map((equipo) => ({ equipo_id: equipo.id, responsable_id: destinoDe(equipo).id })),
            { onSuccess: () => setConfirmando(false) }
        );
    }

    function empezarOtro() {
        trasladar.reset();
        setSeleccionados([]);
        setIndividuales({});
        setNuevoGeneral(null);
    }

    if (trasladar.isSuccess) {
        const resultado = trasladar.data;

        return (
            <div className="space-y-4">
                <div className="rounded border border-sena/40 bg-sena-soft px-4 py-3 text-sm text-ink">
                    <p className="font-semibold">{resultado.mensaje}</p>
                    {resultado.sin_cambios > 0 && (
                        <p className="mt-1 text-slate-600">
                            {resultado.sin_cambios} equipo(s) ya tenían ese cuentadante y no se modificaron.
                        </p>
                    )}
                </div>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={empezarOtro} className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
                        Hacer otro traslado
                    </button>
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

    const errores = trasladar.error?.response?.data?.errors;
    const mensajeError = trasladar.isError
        ? (errores ? Object.values(errores)[0]?.[0] : null) ?? 'No se pudo hacer el traslado. Intenta de nuevo.'
        : null;

    return (
        <div className="space-y-6">
            <p className="text-sm text-slate-600">
                Cambia el cuentadante de uno o varios equipos a otro cuentadante ya registrado. Es una actualización del
                equipo, no un traslado de ubicación: no se guarda en el historial de traslados.
            </p>

            {/* Paso 1 */}
            <section>
                <h3 className="mb-2 text-sm font-semibold text-ink">1. Elige los equipos</h3>

                <div className="mb-3 flex flex-wrap items-end gap-3">
                    <div>
                        <label htmlFor="traslado_origen" className="mb-1 block text-xs font-medium text-slate-600">
                            Cuentadante actual
                        </label>
                        <BuscadorResponsable
                            id="traslado_origen"
                            value={sinCuentadante ? null : origen}
                            onChange={(responsable) => {
                                setOrigen(responsable);
                                if (responsable) setSinCuentadante(false);
                            }}
                            placeholder="Nombre o documento..."
                            className="w-64"
                            inputClassName={CAMPO}
                        />
                    </div>
                    <div>
                        <label htmlFor="traslado_texto" className="mb-1 block text-xs font-medium text-slate-600">
                            Placa, serial o hostname
                        </label>
                        <input
                            id="traslado_texto"
                            type="text"
                            value={texto}
                            onChange={(event) => setTexto(event.target.value)}
                            placeholder="Buscar equipo..."
                            className={`${CAMPO} w-56`}
                        />
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 pb-1 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={sinCuentadante}
                            onChange={(event) => setSinCuentadante(event.target.checked)}
                            className="h-4 w-4 accent-sena"
                        />
                        Solo equipos sin cuentadante
                    </label>
                </div>

                <div className="rounded border border-slate-200">
                    {!hayCriterio && (
                        <p className="px-3 py-4 text-sm text-slate-500">
                            Elige el cuentadante actual o escribe una placa, serial u hostname para ver equipos.
                        </p>
                    )}

                    {hayCriterio && resultados.isLoading && <p className="px-3 py-4 text-sm text-slate-500">Buscando equipos...</p>}
                    {hayCriterio && resultados.isError && (
                        <p className="px-3 py-4 text-sm text-danger">No se pudieron cargar los equipos.</p>
                    )}
                    {hayCriterio && resultados.data && encontrados.length === 0 && (
                        <p className="px-3 py-4 text-sm text-slate-500">No hay equipos con ese criterio.</p>
                    )}

                    {encontrados.length > 0 && (
                        <>
                            <div className="flex items-center justify-between border-b border-slate-100 bg-surface px-3 py-2 text-xs text-slate-600">
                                <label className="flex cursor-pointer items-center gap-2 font-medium">
                                    <input type="checkbox" checked={todosMarcados} onChange={alternarTodos} className="h-4 w-4 accent-sena" />
                                    {todosMarcados ? 'Desmarcar todos' : `Marcar todos (${encontrados.length})`}
                                </label>
                                {resultados.data.total > resultados.data.limite && (
                                    <span className="text-warning">
                                        Se muestran {resultados.data.limite} de {resultados.data.total}. Afina la búsqueda para ver el resto.
                                    </span>
                                )}
                            </div>
                            <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
                                {encontrados.map((equipo) => (
                                    <li key={equipo.id}>
                                        <label className="flex cursor-pointer items-center gap-3 px-3 py-1.5 text-sm hover:bg-surface">
                                            <input
                                                type="checkbox"
                                                checked={idsSeleccionados.has(equipo.id)}
                                                onChange={() => alternar(equipo)}
                                                className="h-4 w-4 accent-sena"
                                            />
                                            <span className="w-32 shrink-0 whitespace-nowrap font-mono text-ink">{equipo.placa_sena}</span>
                                            <span className="w-40 shrink-0 truncate text-slate-500">{equipo.tipo_equipo ?? '—'}</span>
                                            <span className="flex-1 truncate text-slate-500">
                                                {equipo.responsable?.nombre ?? <span className="text-slate-400">Sin cuentadante</span>}
                                            </span>
                                            <span className="hidden w-56 truncate text-xs text-slate-400 md:block">{equipo.ubicacion}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            </section>

            {/* Paso 2 */}
            <section>
                <h3 className="mb-2 text-sm font-semibold text-ink">
                    2. Elige el nuevo cuentadante{' '}
                    <span className="font-normal text-slate-400">({seleccionados.length} equipo(s) seleccionado(s))</span>
                </h3>

                {seleccionados.length === 0 ? (
                    <p className="rounded border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
                        Todavía no has seleccionado equipos.
                    </p>
                ) : (
                    <>
                        <div className="mb-3 flex flex-wrap items-end gap-3 rounded border border-slate-200 bg-surface p-3">
                            <div>
                                <label htmlFor="traslado_general" className="mb-1 block text-xs font-medium text-slate-600">
                                    Nuevo cuentadante para todos
                                </label>
                                <BuscadorResponsable
                                    id="traslado_general"
                                    value={nuevoGeneral}
                                    onChange={(responsable) => {
                                        setConfirmando(false);
                                        setNuevoGeneral(responsable);
                                    }}
                                    placeholder="Nombre o documento..."
                                    className="w-72"
                                    inputClassName={`${CAMPO} bg-white`}
                                />
                            </div>
                            <p className="pb-1 text-xs text-slate-500">
                                Si un equipo debe ir a otra persona, cámbialo en su fila: lo de la fila manda sobre este campo.
                            </p>
                        </div>

                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500">
                                    <th className="py-2 pr-3 font-medium">Placa SENA</th>
                                    <th className="py-2 pr-3 font-medium">Tipo</th>
                                    <th className="py-2 pr-3 font-medium">Cuentadante actual</th>
                                    <th className="py-2 pr-3 font-medium">Nuevo cuentadante</th>
                                    <th className="py-2 font-medium" aria-label="Quitar" />
                                </tr>
                            </thead>
                            <tbody>
                                {seleccionados.map((equipo) => {
                                    const destino = destinoDe(equipo);
                                    const esIndividual = Boolean(individuales[equipo.id]);
                                    const igual = destino && destino.id === equipo.responsable?.id;

                                    return (
                                        <tr key={equipo.id} className="border-b border-slate-100 align-top">
                                            <td className="whitespace-nowrap py-2 pr-3 font-mono text-ink">{equipo.placa_sena}</td>
                                            <td className="py-2 pr-3 text-slate-500">{equipo.tipo_equipo ?? '—'}</td>
                                            <td className="py-2 pr-3 text-slate-500">
                                                {equipo.responsable?.nombre ?? <span className="text-slate-400">Sin cuentadante</span>}
                                            </td>
                                            <td className="py-2 pr-3">
                                                <BuscadorResponsable
                                                    id={`traslado_fila_${equipo.id}`}
                                                    value={destino}
                                                    onChange={(responsable) => cambiarIndividual(equipo.id, responsable)}
                                                    placeholder={nuevoGeneral ? nuevoGeneral.nombre : 'Elige el cuentadante...'}
                                                    className="w-64"
                                                    inputClassName={`${CAMPO} ${!destino ? 'border-warning' : ''}`}
                                                />
                                                <div className="mt-1 flex gap-2 text-xs">
                                                    {!destino && <span className="text-warning">Falta el nuevo cuentadante</span>}
                                                    {igual && <span className="text-slate-400">Ya es su cuentadante: no cambia</span>}
                                                    {esIndividual && nuevoGeneral && (
                                                        <button
                                                            type="button"
                                                            onClick={() => cambiarIndividual(equipo.id, null)}
                                                            className="text-slate-500 underline hover:text-ink"
                                                        >
                                                            Usar el de todos
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-2 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => quitar(equipo.id)}
                                                    aria-label={`Quitar ${equipo.placa_sena} de la selección`}
                                                    className="rounded px-1 text-lg leading-none text-slate-400 hover:text-danger"
                                                >
                                                    ×
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </>
                )}
            </section>

            {mensajeError && <p className="text-sm text-danger">{mensajeError}</p>}

            <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
                {confirmando ? (
                    <>
                        <p className="mr-auto text-sm text-ink">
                            ¿Confirmas? Se cambiará el cuentadante de <strong>{aCambiar.length}</strong> equipo(s).
                        </p>
                        <button
                            type="button"
                            onClick={() => setConfirmando(false)}
                            className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                        >
                            Volver
                        </button>
                        <button
                            type="button"
                            onClick={enviar}
                            disabled={trasladar.isPending}
                            className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark disabled:opacity-50"
                        >
                            {trasladar.isPending ? 'Trasladando...' : 'Sí, trasladar'}
                        </button>
                    </>
                ) : (
                    <>
                        {seleccionados.length > 0 && sinDestino.length > 0 && (
                            <p className="mr-auto text-sm text-warning">
                                Falta el nuevo cuentadante en {sinDestino.length} equipo(s).
                            </p>
                        )}
                        <button type="button" onClick={onClose} className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirmando(true)}
                            disabled={!puedeEnviar}
                            className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark disabled:opacity-50"
                        >
                            Trasladar {aCambiar.length > 0 ? `${aCambiar.length} equipo(s)` : 'equipos'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}