import { useState } from 'react';
import {
  useResponsables,
  useCreateResponsable,
  useUpdateResponsable,
  useDeleteResponsable,
} from '../hooks/useResponsables';
import { ResponsableTable } from '../components/ResponsableTable';
import { ResponsableForm } from '../components/ResponsableForm';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Modal } from '../../../shared/components/Modal';

export function ResponsablesPage() {
  const [page, setPage] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [editingResponsable, setEditingResponsable] = useState(null);
  const [deletingResponsable, setDeletingResponsable] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const { data, isLoading, isError } = useResponsables({ page, nombre: busqueda || undefined });
  const createResponsable = useCreateResponsable();
  const updateResponsable = useUpdateResponsable();
  const deleteResponsable = useDeleteResponsable();

  const serverErrors =
    createResponsable.error?.response?.data?.errors ?? updateResponsable.error?.response?.data?.errors;

  function handleSubmit(payload) {
    if (editingResponsable?.id) {
      updateResponsable.mutate(
        { id: editingResponsable.id, payload },
        { onSuccess: () => setEditingResponsable(null) }
      );
    } else {
      createResponsable.mutate(payload, { onSuccess: () => setEditingResponsable(null) });
    }
  }

  function handleConfirmDelete() {
    if (!deletingResponsable) return;

    setDeleteError(null);
    deleteResponsable.mutate(deletingResponsable?.id, {
      onSuccess: () => setDeletingResponsable(null),
      onError: () => setDeleteError('No se pudo eliminar el responsable. Intenta de nuevo.'),
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Responsables</h1>
        <button
          onClick={() => setEditingResponsable({})}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Nuevo responsable
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(event) => {
            setBusqueda(event.target.value);
            setPage(1);
          }}
          className="w-full max-w-sm rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      {isLoading && <p className="text-sm text-slate-500">Cargando responsables...</p>}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar los responsables.</p>}

      {data && (
        <>
          <ResponsableTable
            responsables={data.data}
            onEdit={setEditingResponsable}
            onDelete={(responsable) => {
              setDeleteError(null);
              setDeletingResponsable(responsable);
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

      {editingResponsable !== null && (
        <Modal
          title={editingResponsable.id ? 'Editar responsable' : 'Nuevo responsable'}
          onClose={() => setEditingResponsable(null)}
        >
          <ResponsableForm
            initialValues={editingResponsable.id ? editingResponsable : null}
            onSubmit={handleSubmit}
            onCancel={() => setEditingResponsable(null)}
            isSubmitting={createResponsable.isPending || updateResponsable.isPending}
            serverErrors={serverErrors}
          />
        </Modal>
      )}

      <ConfirmDialog
        open={!!deletingResponsable}
        title="¿Eliminar este responsable?"
        description={
          deleteError ??
          `Esta acción no se puede deshacer${
            deletingResponsable ? `: "${deletingResponsable.nombre}"` : ''
          }. Sus equipos asignados quedarán sin responsable.`
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingResponsable(null)}
        isLoading={deleteResponsable.isPending}
      />
    </div>
  );
}