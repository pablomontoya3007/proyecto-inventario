import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useNovedades, useCreateNovedad, useResolverNovedad } from '../hooks/useNovedades';
import { useSedes } from '../../sedes/hooks/useSedes';
import { useSubsedes } from '../../subsedes/hooks/useSubsedes';
import { useUbicaciones } from '../../ubicaciones/hooks/useUbicaciones';
import { useDashboard } from '../../dashboard/hooks/useDashboard';
import { FiltroUbicacionCascada } from '../../../shared/components/FiltroUbicacionCascada';
import { ContadoresModulo } from '../../../shared/components/ContadoresModulo';
import { AvisoBanner } from '../../../shared/components/AvisoBanner';
import { avisoDeNotificacion } from '../../../shared/utils/avisoNotificacion';
import { NovedadTable } from '../components/NovedadTable';
import { NovedadForm } from '../components/NovedadForm';
import { DetalleNovedad } from '../components/DetalleNovedad';
import { Modal } from '../../../shared/components/Modal';

const CAMPO =
    'rounded border border-slate-300 px-3 py-2 text-sm focus:border-sena focus:outline-none focus:ring-1 focus:ring-sena';

const ESTADOS_NOVEDAD = [
    { value: 'abierta', label: 'Abierta' },
    { value: 'resuelta', label: 'Resuelta' },
];

/**
 * Los filtros iniciales pueden venir en la URL (?placa=..., ?estado=abierta,
 * ?sin_asignar=1): así llegan el indicador de Equipos y las tarjetas del
 * Inicio, ya filtrados.
 */
export function NovedadesPage() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();

    const [page, setPage] = useState(1);
    const [placaFiltro, setPlacaFiltro] = useState(() => searchParams.get('placa') ?? '');
    const [estadoFiltro, setEstadoFiltro] = useState(() => searchParams.get('estado') ?? '');
    const [sinAsignar, setSinAsignar] = useState(() => searchParams.get('sin_asignar') === '1');
    const [usuarioFiltro, setUsuarioFiltro] = useState('');
    const [fechaDesdeFiltro, setFechaDesdeFiltro] = useState('');
    const [fechaHastaFiltro, setFechaHastaFiltro] = useState('');
    const [sedeFiltro, setSedeFiltro] = useState('');
    const [subsedeFiltro, setSubsedeFiltro] = useState('');
    const [ubicacionFiltro, setUbicacionFiltro] = useState('');
    const [soloMias, setSoloMias] = useState(false);

    const [registrando, setRegistrando] = useState(false);
    const [viendoNovedad, setViendoNovedad] = useState(null);
    const [errorResolver, setErrorResolver] = useState(null);
    const [aviso, setAviso] = useState(null);

    const filtros = {
        ...(placaFiltro ? { placa_sena: placaFiltro } : {}),
        ...(estadoFiltro ? { estado: estadoFiltro } : {}),
        ...(sinAsignar ? { sin_asignar: 1 } : {}),
        ...(usuarioFiltro ? { usuario: usuarioFiltro } : {}),
        ...(fechaDesdeFiltro ? { fecha_desde: fechaDesdeFiltro } : {}),
        ...(fechaHastaFiltro ? { fecha_hasta: fechaHastaFiltro } : {}),
        ...(soloMias && user?.id ? { asignado_a: user.id } : {}),
        ...(ubicacionFiltro
            ? { ubicacion_formacion_id: ubicacionFiltro }
            : subsedeFiltro
                ? { subsede_id: subsedeFiltro }
                : sedeFiltro
                    ? { sede_id: sedeFiltro }
                    : {}),
    };
    const hayFiltrosPropios = Boolean(
        placaFiltro || estadoFiltro || sinAsignar || usuarioFiltro || fechaDesdeFiltro || fechaHastaFiltro || soloMias
    );

    const { data: sedesData } = useSedes(1);
    const { data: subsedesData } = useSubsedes({ page: 1, sedeId: sedeFiltro || undefined });
    const { data: ubicacionesData } = useUbicaciones({ page: 1, subsedeId: subsedeFiltro || undefined });
    const { data: resumen, isLoading: cargandoResumen } = useDashboard();

    const { data, isLoading, isError } = useNovedades({ page, filtros });
    const crear = useCreateNovedad();
    const resolver = useResolverNovedad();

    const serverErrors = crear.error?.response?.data?.errors;
    const novedades = resumen?.novedades ?? {};

    // Contadores (totales del sistema). Clic = aplicar/quitar ese filtro.
    const filtroSinAtender = estadoFiltro === 'abierta' && !sinAsignar;
    const filtroSinAsignar = estadoFiltro === 'abierta' && sinAsignar;
    const filtroResueltas = estadoFiltro === 'resuelta';

    const contadores = [
        {
            clave: 'sin_atender',
            etiqueta: 'Sin atender',
            valor: novedades.sin_atender,
            tono: (novedades.sin_atender ?? 0) > 0 ? 'warning' : 'success',
            activo: filtroSinAtender,
            onClick: () => {
                setEstadoFiltro(filtroSinAtender ? '' : 'abierta');
                setSinAsignar(false);
                setPage(1);
            },
        },
        {
            clave: 'sin_asignar',
            etiqueta: 'Sin asignar a nadie',
            valor: novedades.sin_asignar,
            tono: (novedades.sin_asignar ?? 0) > 0 ? 'danger' : 'success',
            activo: filtroSinAsignar,
            onClick: () => {
                setEstadoFiltro(filtroSinAsignar ? '' : 'abierta');
                setSinAsignar(!filtroSinAsignar);
                setPage(1);
            },
        },
        {
            clave: 'resueltas',
            etiqueta: 'Resueltas',
            valor: novedades.resueltas,
            tono: 'success',
            activo: filtroResueltas,
            onClick: () => {
                setEstadoFiltro(filtroResueltas ? '' : 'resuelta');
                setSinAsignar(false);
                setPage(1);
            },
        },
    ];

    function conFiltro(setter) {
        return (event) => {
            setter(event.target.value);
            setPage(1);
        };
    }

    function handleLimpiarFiltrosPropios() {
        setPlacaFiltro('');
        setEstadoFiltro('');
        setSinAsignar(false);
        setUsuarioFiltro('');
        setFechaDesdeFiltro('');
        setFechaHastaFiltro('');
        setSoloMias(false);
        setPage(1);
    }

    function abrirRegistro() {
        crear.reset();
        setAviso(null);
        setRegistrando(true);
    }

    function abrirDetalle(novedad) {
        resolver.reset();
        setErrorResolver(null);
        setViendoNovedad(novedad);
    }

    function handleRegistrar(payload) {
        crear.mutate(payload, {
            onSuccess: (novedad) => {
                setRegistrando(false);
                setAviso(avisoDeNotificacion(novedad.notificaciones, 'Novedad registrada.'));
            },
        });
    }

    function handleResolver(nota) {
        if (!viendoNovedad) return;

        setErrorResolver(null);
        resolver.mutate(
            { id: viendoNovedad.id, payload: { nota_resolucion: nota } },
            {
                onSuccess: () => {
                    setViendoNovedad(null);
                    setAviso({ tipo: 'exito', texto: 'Novedad marcada como resuelta.' });
                },
                onError: (error) =>
                    setErrorResolver(error.response?.data?.message ?? 'No se pudo marcar como resuelta. Intenta de nuevo.'),
            }
        );
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-bold text-ink">Novedades</h1>
                <button
                    onClick={abrirRegistro}
                    className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark"
                >
                    Registrar novedad
                </button>
            </div>

            <ContadoresModulo contadores={contadores} cargando={cargandoResumen} />

            <AvisoBanner aviso={aviso} onCerrar={() => setAviso(null)} />

            <FiltroUbicacionCascada
                sedesData={sedesData}
                subsedesData={subsedesData}
                ubicacionesData={ubicacionesData}
                sedeFiltro={sedeFiltro}
                subsedeFiltro={subsedeFiltro}
                ubicacionFiltro={ubicacionFiltro}
                onSedeChange={(valor) => {
                    setSedeFiltro(valor);
                    setSubsedeFiltro('');
                    setUbicacionFiltro('');
                    setPage(1);
                }}
                onSubsedeChange={(valor) => {
                    setSubsedeFiltro(valor);
                    setUbicacionFiltro('');
                    setPage(1);
                }}
                onUbicacionChange={(valor) => {
                    setUbicacionFiltro(valor);
                    setPage(1);
                }}
                onLimpiar={() => {
                    setSedeFiltro('');
                    setSubsedeFiltro('');
                    setUbicacionFiltro('');
                    setPage(1);
                }}
            />

            <div className="mb-4 flex flex-wrap items-end gap-3 rounded border border-slate-200 bg-white p-4">
                <div>
                    <label htmlFor="filtro_novedad_placa" className="block text-xs text-slate-500">
                        Placa SENA
                    </label>
                    <input
                        id="filtro_novedad_placa"
                        type="text"
                        placeholder="Placa..."
                        value={placaFiltro}
                        onChange={conFiltro(setPlacaFiltro)}
                        className={CAMPO}
                    />
                </div>

                <div>
                    <label htmlFor="filtro_novedad_estado" className="block text-xs text-slate-500">
                        Estado
                    </label>
                    <select id="filtro_novedad_estado" value={estadoFiltro} onChange={conFiltro(setEstadoFiltro)} className={CAMPO}>
                        <option value="">Todas</option>
                        {ESTADOS_NOVEDAD.map((estado) => (
                            <option key={estado.value} value={estado.value}>
                                {estado.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="filtro_novedad_usuario" className="block text-xs text-slate-500">
                        Reportada por
                    </label>
                    <input
                        id="filtro_novedad_usuario"
                        type="text"
                        placeholder="Nombre del usuario..."
                        value={usuarioFiltro}
                        onChange={conFiltro(setUsuarioFiltro)}
                        className={CAMPO}
                    />
                </div>

                <div>
                    <label htmlFor="filtro_novedad_desde" className="block text-xs text-slate-500">
                        Desde
                    </label>
                    <input
                        id="filtro_novedad_desde"
                        type="date"
                        value={fechaDesdeFiltro}
                        max={fechaHastaFiltro || undefined}
                        onChange={conFiltro(setFechaDesdeFiltro)}
                        className={CAMPO}
                    />
                </div>

                <div>
                    <label htmlFor="filtro_novedad_hasta" className="block text-xs text-slate-500">
                        Hasta
                    </label>
                    <input
                        id="filtro_novedad_hasta"
                        type="date"
                        value={fechaHastaFiltro}
                        min={fechaDesdeFiltro || undefined}
                        onChange={conFiltro(setFechaHastaFiltro)}
                        className={CAMPO}
                    />
                </div>

                <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-slate-600">
                    <input
                        type="checkbox"
                        checked={soloMias}
                        onChange={(event) => {
                            setSoloMias(event.target.checked);
                            setPage(1);
                        }}
                        className="h-4 w-4 accent-sena"
                    />
                    Asignadas a mí
                </label>

                <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-slate-600">
                    <input
                        type="checkbox"
                        checked={sinAsignar}
                        onChange={(event) => {
                            setSinAsignar(event.target.checked);
                            setPage(1);
                        }}
                        className="h-4 w-4 accent-sena"
                    />
                    Sin asignar
                </label>

                {hayFiltrosPropios && (
                    <button
                        type="button"
                        onClick={handleLimpiarFiltrosPropios}
                        className="pb-2 text-sm text-slate-500 underline hover:text-ink"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {isLoading && <p className="text-sm text-slate-500">Cargando novedades...</p>}
            {isError && <p className="text-sm text-danger">No se pudieron cargar las novedades.</p>}

            {data && (
                <>
                    <div className="rounded border border-slate-200 bg-white p-4">
                        <NovedadTable novedades={data.data} onVer={abrirDetalle} />
                    </div>

                    {data.meta && data.meta.last_page > 1 && (
                        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">
                                Anterior
                            </button>
                            <span>
                                Página {data.meta.current_page} de {data.meta.last_page}
                            </span>
                            <button
                                disabled={page >= data.meta.last_page}
                                onClick={() => setPage((p) => p + 1)}
                                className="disabled:opacity-40"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}

            {registrando && (
                <Modal title="Registrar novedad" onClose={() => setRegistrando(false)} maxWidth="max-w-2xl">
                    <NovedadForm
                        onSubmit={handleRegistrar}
                        onCancel={() => setRegistrando(false)}
                        isSubmitting={crear.isPending}
                        serverErrors={serverErrors}
                    />
                </Modal>
            )}

            {viendoNovedad && (
                <Modal title="Detalle de la novedad" onClose={() => setViendoNovedad(null)} maxWidth="max-w-2xl">
                    <DetalleNovedad
                        novedad={viendoNovedad}
                        onResolver={handleResolver}
                        isResolviendo={resolver.isPending}
                        errorResolver={errorResolver}
                        onCerrar={() => setViendoNovedad(null)}
                    />
                </Modal>
            )}
        </div>
    );
}