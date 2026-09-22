import { useState } from 'react';
import {
  useMantenimientos,
  useCreateMantenimiento,
  useUpdateMantenimiento,
  useDeleteMantenimiento,
} from '../hooks/useMantenimientos';
import { useSedes } from '../../sedes/hooks/useSedes';
import { useSubsedes } from '../../subsedes/hooks/useSubsedes';
import { useUbicaciones } from '../../ubicaciones/hooks/useUbicaciones';
import { FiltroUbicacionCascada } from '../../../shared/components/FiltroUbicacionCascada';
import { MantenimientoTable } from '../components/MantenimientoTable';
import { HistorialMantenimientoTable } from '../components/HistorialMantenimientoTable';
import { MantenimientoForm } from '../components/MantenimientoForm';
import { MarcarListoForm } from '../components/MarcarListoForm';
import { Modal } from '../../../shared/components/Modal';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';

export function MantenimientosPage() {
  const [pestana, setPestana] = useState('activos'); // 'activos' | 'historial'
  const [page, setPage] = useState(1);
  const [sedeFiltro, setSedeFiltro] = useState('');
  const [subsedeFiltro, setSubsedeFiltro] = useState('');
  const [ubicacionFiltro, setUbicacionFiltro] = useState('');
  const [creando, setCreando] = useState(false);
  const [completandoMantenimiento, setCompletandoMantenimiento] = useState(null);
  const [deletingMantenimiento, setDeletingMantenimiento] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [errorCambioEstado, setErrorCambioEstado] = useState(null);

  function cambiarPestana(nueva) {
    setPestana(nueva);
    setPage(1);
  }

  function handleSedeChange(valor) {
    setSedeFiltro(valor);
    setSubsedeFiltro('');
    setUbicacionFiltro('');
    setPage(1);
  }

  function handleSubsedeChange(valor) {
    setSubsedeFiltro(valor);
    setUbicacionFiltro('');
    setPage(1);
  }

  function handleUbicacionChange(valor) {
    setUbicacionFiltro(valor);
    setPage(1);
  }

  function handleLimpiarFiltros() {
    setSedeFiltro('');
    setSubsedeFiltro('');
    setUbicacionFiltro('');
    setPage(1);
  }

  const filtros = {
    ...(ubicacionFiltro
      ? { ubicacion_formacion_id: ubicacionFiltro }
      : subsedeFiltro
        ? { subsede_id: subsedeFiltro }
        : sedeFiltro
          ? { sede_id: sedeFiltro }
          : {}),
  };

  const { data: sedesData } = useSedes(1);
  const { data: subsedesData } = useSubsedes({ page: 1, sedeId: sedeFiltro || undefined });
  const { data: ubicacionesData } = useUbicaciones({ page: 1, subsedeId: subsedeFiltro || undefined });

  const { data, isLoading, isError } = useMantenimientos({ page, completado: pestana === 'historial', filtros });
  const createMantenimiento = useCreateMantenimiento();
  const updateMantenimiento = useUpdateMantenimiento();
  const deleteMantenimiento = useDeleteMantenimiento();

  const serverErrors = createMantenimiento.error?.response?.data?.errors;

  function handleSubmit(payload) {
    createMantenimiento.mutate(payload, { onSuccess: () => setCreando(false) });
  }

  function handleCambiarEstado(mantenimiento, nuevoEstado) {
    setErrorCambioEstado(null);
    updateMantenimiento.mutate(
      { id: mantenimiento.id, payload: { estado: nuevoEstado } },
      { onError: () => setErrorCambioEstado('No se pudo cambiar el estado. Intenta de nuevo.') }
    );
  }

  function handleAbrirCompletar(mantenimiento) {
    setErrorCambioEstado(null);
    setCompletandoMantenimiento(mantenimiento);
  }

  function handleConfirmarListo(nota) {
    if (!completandoMantenimiento) return;

    const descripcionActual = completandoMantenimiento.descripcion?.trim();
    let descripcionFinal = descripcionActual || null;

    if (nota) {
      descripcionFinal = descripcionActual ? `${descripcionActual}\n\nAl completar: ${nota}` : `Al completar: ${nota}`;
    }

    updateMantenimiento.mutate(
      { id: completandoMantenimiento.id, payload: { estado: 'listo', descripcion: descripcionFinal } },
      {
        onSuccess: () => setCompletandoMantenimiento(null),
        onError: () => setErrorCambioEstado('No se pudo marcar como listo. Intenta de nuevo.'),
      }
    );
  }

  function handleConfirmDelete() {
    if (!deletingMantenimiento) return;

    setDeleteError(null);
    deleteMantenimiento.mutate(deletingMantenimiento?.id, {
      onSuccess: () => setDeletingMantenimiento(null),
      onError: () => setDeleteError('No se pudo eliminar el mantenimiento. Intenta de nuevo.'),
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Mantenimientos</h1>
        <button
          onClick={() => setCreando(true)}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Programar mantenimiento
        </button>
      </div>

      <FiltroUbicacionCascada
        sedesData={sedesData}
        subsedesData={subsedesData}
        ubicacionesData={ubicacionesData}
        sedeFiltro={sedeFiltro}
        subsedeFiltro={subsedeFiltro}
        ubicacionFiltro={ubicacionFiltro}
        onSedeChange={handleSedeChange}
        onSubsedeChange={handleSubsedeChange}
        onUbicacionChange={handleUbicacionChange}
        onLimpiar={handleLimpiarFiltros}
      />

      <div className="mb-4 flex gap-1 border-b border-slate-200">
        <button
          onClick={() => cambiarPestana('activos')}
          className={`px-4 py-2 text-sm font-medium ${
            pestana === 'activos'
              ? 'border-b-2 border-slate-800 text-slate-800'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Activos
        </button>
        <button
          onClick={() => cambiarPestana('historial')}
          className={`px-4 py-2 text-sm font-medium ${
            pestana === 'historial'
              ? 'border-b-2 border-slate-800 text-slate-800'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Historial
        </button>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Cargando...</p>}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar los mantenimientos.</p>}
      {errorCambioEstado && <p className="mb-3 text-sm text-red-600">{errorCambioEstado}</p>}

      {data && (
        <>
          {pestana === 'activos' ? (
            <MantenimientoTable
              mantenimientos={data.data}
              onCambiarEstado={handleCambiarEstado}
              onMarcarListo={handleAbrirCompletar}
              onDelete={(mantenimiento) => {
                setDeleteError(null);
                setDeletingMantenimiento(mantenimiento);
              }}
            />
          ) : (
            <HistorialMantenimientoTable
              mantenimientos={data.data}
              onDelete={(mantenimiento) => {
                setDeleteError(null);
                setDeletingMantenimiento(mantenimiento);
              }}
            />
          )}

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

      {creando && (
        <Modal title="Programar mantenimiento" onClose={() => setCreando(false)}>
          <MantenimientoForm
            onSubmit={handleSubmit}
            onCancel={() => setCreando(false)}
            isSubmitting={createMantenimiento.isPending}
            serverErrors={serverErrors}
          />
        </Modal>
      )}

      {completandoMantenimiento && (
        <Modal title="Marcar como listo" onClose={() => setCompletandoMantenimiento(null)}>
          <MarcarListoForm
            onSubmit={handleConfirmarListo}
            onCancel={() => setCompletandoMantenimiento(null)}
            isSubmitting={updateMantenimiento.isPending}
          />
        </Modal>
      )}

      <ConfirmDialog
        open={!!deletingMantenimiento}
        title="¿Eliminar este mantenimiento?"
        description={deleteError ?? 'Esta acción no se puede deshacer.'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingMantenimiento(null)}
        isLoading={deleteMantenimiento.isPending}
      />
    </div>
  );
}