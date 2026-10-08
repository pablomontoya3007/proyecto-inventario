import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEquipos, useCreateEquipo, useUpdateEquipo, useDeleteEquipo } from '../hooks/useEquipos';
import { useTiposEquipo } from '../../tipos-equipo/hooks/useTiposEquipo';
import { useSedes } from '../../sedes/hooks/useSedes';
import { useSubsedes } from '../../subsedes/hooks/useSubsedes';
import { useUbicaciones } from '../../ubicaciones/hooks/useUbicaciones';
import { useDashboard } from '../../dashboard/hooks/useDashboard';
import { BuscadorResponsable } from '../../responsables/components/BuscadorResponsable';
import { EquipoTable } from '../components/EquipoTable';
import { EquipoForm } from '../components/EquipoForm';
import { HojaDeVidaModal } from '../components/HojaDeVidaModal';
import { ImportarEquiposModal } from '../components/ImportarEquiposModal';
import { ContadoresModulo } from '../../../shared/components/ContadoresModulo';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Modal } from '../../../shared/components/Modal';

// Confirmado contra app/Enums/EstadoEquipo.php. "tono" colorea su contador.
const ESTADOS_EQUIPO = [
  { value: 'activo', label: 'Activos', tono: 'success' },
  { value: 'mantenimiento', label: 'En mantenimiento', tono: 'warning' },
  { value: 'de_baja', label: 'De baja', tono: 'danger' },
  { value: 'extraviado', label: 'Extraviados', tono: 'danger' },
];

const CAMPO =
  'rounded border border-slate-300 px-2 py-1 text-sm focus:border-sena focus:outline-none focus:ring-1 focus:ring-sena';

/**
 * Los filtros iniciales de estado y "sin licencia" pueden venir en la
 * URL (?estado=activo, ?sin_licencia=1): así llegan las tarjetas del
 * Inicio, ya filtradas.
 */
export function EquiposPage() {
  const [searchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [placaFiltro, setPlacaFiltro] = useState('');
  const [serialFiltro, setSerialFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [responsableFiltro, setResponsableFiltro] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState(() => searchParams.get('estado') ?? '');
  const [sinLicencia, setSinLicencia] = useState(() => searchParams.get('sin_licencia') === '1');
  const [sedeFiltro, setSedeFiltro] = useState('');
  const [subsedeFiltro, setSubsedeFiltro] = useState('');
  const [ubicacionFiltro, setUbicacionFiltro] = useState('');

  const [editingEquipo, setEditingEquipo] = useState(null);
  const [viendoHojaDeVida, setViendoHojaDeVida] = useState(null);
  const [deletingEquipo, setDeletingEquipo] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [importando, setImportando] = useState(false);

  const filtros = {
    ...(placaFiltro ? { placa_sena: placaFiltro } : {}),
    ...(serialFiltro ? { serial: serialFiltro } : {}),
    ...(tipoFiltro ? { tipo_equipo_id: tipoFiltro } : {}),
    ...(responsableFiltro ? { responsable_id: responsableFiltro.id } : {}),
    ...(estadoFiltro ? { estado: estadoFiltro } : {}),
    ...(sinLicencia ? { sin_licencia: 1 } : {}),
    ...(ubicacionFiltro
      ? { ubicacion_formacion_id: ubicacionFiltro }
      : subsedeFiltro
        ? { subsede_id: subsedeFiltro }
        : sedeFiltro
          ? { sede_id: sedeFiltro }
          : {}),
  };

  const { data, isLoading, isError } = useEquipos(filtros, page);
  const { data: resumen, isLoading: cargandoResumen } = useDashboard();
  const { data: tiposData } = useTiposEquipo();
  const { data: sedesData } = useSedes(1);
  const { data: subsedesData } = useSubsedes({ page: 1, sedeId: sedeFiltro || undefined });
  const { data: ubicacionesData } = useUbicaciones({ page: 1, subsedeId: subsedeFiltro || undefined });

  const createEquipo = useCreateEquipo();
  const updateEquipo = useUpdateEquipo();
  const deleteEquipo = useDeleteEquipo();

  const serverErrors = createEquipo.error?.response?.data?.errors ?? updateEquipo.error?.response?.data?.errors;

  // Contadores: totales del sistema. Clic = aplicar/quitar ese filtro.
  const contadores = [
    {
      clave: 'total',
      etiqueta: 'Total de equipos',
      valor: resumen?.equipos?.total,
      activo: !estadoFiltro && !sinLicencia,
      onClick: () => {
        setEstadoFiltro('');
        setSinLicencia(false);
        setPage(1);
      },
    },
    ...ESTADOS_EQUIPO.map((estado) => ({
      clave: estado.value,
      etiqueta: estado.label,
      valor: resumen?.equipos?.por_estado?.[estado.value],
      tono: estado.tono,
      activo: estadoFiltro === estado.value,
      onClick: () => {
        setEstadoFiltro((actual) => (actual === estado.value ? '' : estado.value));
        setPage(1);
      },
    })),
    {
      clave: 'sin_licencia',
      etiqueta: 'Sin licencia',
      valor: resumen?.equipos?.sin_licencia,
      tono: 'warning',
      activo: sinLicencia,
      onClick: () => {
        setSinLicencia((actual) => !actual);
        setPage(1);
      },
    },
  ];

  function handleSedeFiltroChange(event) {
    setSedeFiltro(event.target.value);
    setSubsedeFiltro('');
    setUbicacionFiltro('');
    setPage(1);
  }

  function handleSubsedeFiltroChange(event) {
    setSubsedeFiltro(event.target.value);
    setUbicacionFiltro('');
    setPage(1);
  }

  function handleSubmit(payload) {
    if (editingEquipo?.id) {
      updateEquipo.mutate({ id: editingEquipo.id, payload }, { onSuccess: () => setEditingEquipo(null) });
    } else {
      createEquipo.mutate(payload, { onSuccess: () => setEditingEquipo(null) });
    }
  }

  function handleConfirmDelete() {
    if (!deletingEquipo) return;

    setDeleteError(null);
    deleteEquipo.mutate(deletingEquipo?.id, {
      onSuccess: () => setDeletingEquipo(null),
      onError: () => setDeleteError('No se pudo eliminar el equipo. Intenta de nuevo.'),
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink">Equipos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setImportando(true)}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-surface"
          >
            Importar Excel
          </button>
          <button
            onClick={() => setEditingEquipo({})}
            className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark"
          >
            Nuevo equipo
          </button>
        </div>
      </div>

      <ContadoresModulo contadores={contadores} cargando={cargandoResumen} />

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded border border-slate-200 bg-white p-4">
        <input
          type="text"
          placeholder="Placa SENA..."
          value={placaFiltro}
          onChange={(event) => {
            setPlacaFiltro(event.target.value);
            setPage(1);
          }}
          className={CAMPO}
        />
        <input
          type="text"
          placeholder="Serial..."
          value={serialFiltro}
          onChange={(event) => {
            setSerialFiltro(event.target.value);
            setPage(1);
          }}
          className={CAMPO}
        />
        <select
          value={tipoFiltro}
          onChange={(event) => {
            setTipoFiltro(event.target.value);
            setPage(1);
          }}
          className={CAMPO}
        >
          <option value="">Todos los tipos</option>
          {tiposData?.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nombre}
            </option>
          ))}
        </select>
        <BuscadorResponsable
          id="filtro_responsable"
          value={responsableFiltro}
          onChange={(responsable) => {
            setResponsableFiltro(responsable);
            setPage(1);
          }}
          placeholder="Responsable..."
          className="w-56"
          inputClassName={CAMPO}
        />
        <select
          value={estadoFiltro}
          onChange={(event) => {
            setEstadoFiltro(event.target.value);
            setPage(1);
          }}
          className={CAMPO}
        >
          <option value="">Todos los estados</option>
          {ESTADOS_EQUIPO.map((estado) => (
            <option key={estado.value} value={estado.value}>
              {estado.label}
            </option>
          ))}
        </select>
        <select value={sedeFiltro} onChange={handleSedeFiltroChange} className={CAMPO}>
          <option value="">Todas las sedes</option>
          {sedesData?.data.map((sede) => (
            <option key={sede.id} value={sede.id}>
              {sede.nombre}
            </option>
          ))}
        </select>
        <select
          value={subsedeFiltro}
          disabled={!sedeFiltro}
          onChange={handleSubsedeFiltroChange}
          className={`${CAMPO} disabled:bg-surface`}
        >
          <option value="">Todas las subsedes</option>
          {subsedesData?.data.map((subsede) => (
            <option key={subsede.id} value={subsede.id}>
              {subsede.nombre}
            </option>
          ))}
        </select>
        <select
          value={ubicacionFiltro}
          disabled={!subsedeFiltro}
          onChange={(event) => {
            setUbicacionFiltro(event.target.value);
            setPage(1);
          }}
          className={`${CAMPO} disabled:bg-surface`}
        >
          <option value="">Todas las ubicaciones</option>
          {ubicacionesData?.data.map((ubicacion) => (
            <option key={ubicacion.id} value={ubicacion.id}>
              {ubicacion.nombre}
            </option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={sinLicencia}
            onChange={(event) => {
              setSinLicencia(event.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 accent-sena"
          />
          Solo sin licencia
        </label>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Cargando equipos...</p>}
      {isError && <p className="text-sm text-danger">No se pudieron cargar los equipos.</p>}

      {data && (
        <>
          <EquipoTable
            equipos={data.data}
            onVerHojaDeVida={setViendoHojaDeVida}
            onEdit={setEditingEquipo}
            onDelete={(equipo) => {
              setDeleteError(null);
              setDeletingEquipo(equipo);
            }}
          />

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

      {editingEquipo !== null && (
        <Modal
          title={editingEquipo.id ? 'Editar equipo' : 'Nuevo equipo'}
          onClose={() => setEditingEquipo(null)}
          maxWidth="max-w-2xl"
        >
          <EquipoForm
            initialValues={editingEquipo.id ? editingEquipo : null}
            onSubmit={handleSubmit}
            onCancel={() => setEditingEquipo(null)}
            isSubmitting={createEquipo.isPending || updateEquipo.isPending}
            serverErrors={serverErrors}
          />
        </Modal>
      )}

      {importando && (
        <Modal title="Importar equipos desde Excel" onClose={() => setImportando(false)} maxWidth="max-w-2xl">
          <ImportarEquiposModal onClose={() => setImportando(false)} />
        </Modal>
      )}

      {viendoHojaDeVida && (
        <HojaDeVidaModal
          equipoId={viendoHojaDeVida.id}
          placaSena={viendoHojaDeVida.placa_sena}
          onClose={() => setViendoHojaDeVida(null)}
        />
      )}

      <ConfirmDialog
        open={!!deletingEquipo}
        title="¿Eliminar este equipo?"
        description={
          deleteError ??
          `Esta acción no se puede deshacer${
            deletingEquipo ? `: "${deletingEquipo.placa_sena}"` : ''
          }.`
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingEquipo(null)}
        isLoading={deleteEquipo.isPending}
      />
    </div>
  );
}