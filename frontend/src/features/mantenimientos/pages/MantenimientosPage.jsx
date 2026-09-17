import { useState } from 'react';
import {
  useMantenimientos,
  useCreateMantenimiento,
  useUpdateMantenimiento,
  useDeleteMantenimiento,
} from '../hooks/useMantenimientos';
import { MantenimientoTable } from '../components/MantenimientoTable';
import { HistorialMantenimientoTable } from '../components/HistorialMantenimientoTable';
import { MantenimientoForm } from '../components/MantenimientoForm';
import { Modal } from '../../../shared/components/Modal';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';

export function MantenimientosPage() {
  const [pestana, setPestana] = useState('activos'); // 'activos' | 'historial'
  const [page, setPage] = useState(1);
  const [creando, setCreando] = useState(false);
  const [deletingMantenimiento, setDeletingMantenimiento] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [errorCambioEstado, setErrorCambioEstado] = useState(null);

  const { data, isLoading, isError } = useMantenimientos({ page, completado: pestana === 'historial' });
  const createMantenimiento = useCreateMantenimiento();
  const updateMantenimiento = useUpdateMantenimiento();
  const deleteMantenimiento = useDeleteMantenimiento();

  const serverErrors = createMantenimiento.error?.response?.data?.errors;

  function cambiarPestana(nueva) {
    setPestana(nueva);
    setPage(1);
  }

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

  function handleMarcarListo(mantenimiento) {
    setErrorCambioEstado(null);
    updateMantenimiento.mutate(
      { id: mantenimiento.id, payload: { estado: 'listo' } },
      { onError: () => setErrorCambioEstado('No se pudo marcar como listo. Intenta de nuevo.') }
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
              onMarcarListo={handleMarcarListo}
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