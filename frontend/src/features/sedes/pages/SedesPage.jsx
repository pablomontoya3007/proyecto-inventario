import { useState } from 'react';
import { useSedes, useCreateSede, useUpdateSede, useDeleteSede } from '../hooks/useSedes';
import { SedeTable } from '../components/SedeTable';
import { SedeForm } from '../components/SedeForm';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Modal } from '../../../shared/components/Modal';

export function SedesPage() {
  const [page, setPage] = useState(1);
  // null = modal cerrado, {} = creando, {id, nombre} = editando
  const [editingSede, setEditingSede] = useState(null);
  const [deletingSede, setDeletingSede] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const { data, isLoading, isError } = useSedes(page);
  const createSede = useCreateSede();
  const updateSede = useUpdateSede();
  const deleteSede = useDeleteSede();

  const serverErrors = createSede.error?.response?.data?.errors ?? updateSede.error?.response?.data?.errors;

  function handleSubmit(payload) {
    if (editingSede?.id) {
      updateSede.mutate({ id: editingSede.id, payload }, { onSuccess: () => setEditingSede(null) });
    } else {
      createSede.mutate(payload, { onSuccess: () => setEditingSede(null) });
    }
  }

  function handleConfirmDelete() {
    if (!deletingSede) return;

    setDeleteError(null);
    deleteSede.mutate(deletingSede?.id, {
      onSuccess: () => setDeletingSede(null),
      onError: (error) => {
        // SedePolicy::delete() rechaza con 403 si la sede tiene subsedes
        // activas — se traduce a un mensaje concreto, no al genérico de
        // Laravel ("This action is unauthorized.").
        setDeleteError(
          error.response?.status === 403
            ? 'No se puede eliminar: esta sede tiene subsedes activas.'
            : 'No se pudo eliminar la sede. Intenta de nuevo.'
        );
      },
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Sedes</h1>
        <button
          onClick={() => setEditingSede({})}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Nueva sede
        </button>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Cargando sedes...</p>}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar las sedes.</p>}

      {data && (
        <>
          <SedeTable
            sedes={data.data}
            onEdit={setEditingSede}
            onDelete={(sede) => {
              setDeleteError(null);
              setDeletingSede(sede);
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

      {editingSede !== null && (
        <Modal title={editingSede.id ? 'Editar sede' : 'Nueva sede'} onClose={() => setEditingSede(null)}>
          <SedeForm
            initialValues={editingSede.id ? editingSede : null}
            onSubmit={handleSubmit}
            onCancel={() => setEditingSede(null)}
            isSubmitting={createSede.isPending || updateSede.isPending}
            serverErrors={serverErrors}
          />
        </Modal>
      )}

      <ConfirmDialog
        open={!!deletingSede}
        title="¿Eliminar esta sede?"
        description={deleteError ?? `Esta acción no se puede deshacer${deletingSede ? `: "${deletingSede.nombre}"` : ''}.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingSede(null)}
        isLoading={deleteSede.isPending}
      />
    </div>
  );
}