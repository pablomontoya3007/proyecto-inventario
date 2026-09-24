import { useState } from 'react';
import { useSubsedes, useCreateSubsede, useUpdateSubsede, useDeleteSubsede } from '../hooks/useSubsedes';
import { useSedes } from '../../sedes/hooks/useSedes';
import { SubsedeTable } from '../components/SubsedeTable';
import { SubsedeForm } from '../components/SubsedeForm';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Modal } from '../../../shared/components/Modal';

export function SubsedesPage() {
  const [page, setPage] = useState(1);
  const [sedeFiltro, setSedeFiltro] = useState('');
  const [editingSubsede, setEditingSubsede] = useState(null);
  const [deletingSubsede, setDeletingSubsede] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const { data, isLoading, isError } = useSubsedes({ page, sedeId: sedeFiltro || undefined });
  const { data: sedesData } = useSedes(1);
  const createSubsede = useCreateSubsede();
  const updateSubsede = useUpdateSubsede();
  const deleteSubsede = useDeleteSubsede();

  const serverErrors = createSubsede.error?.response?.data?.errors ?? updateSubsede.error?.response?.data?.errors;

  function handleSubmit(payload) {
    if (editingSubsede?.id) {
      updateSubsede.mutate({ id: editingSubsede.id, payload }, { onSuccess: () => setEditingSubsede(null) });
    } else {
      createSubsede.mutate(payload, { onSuccess: () => setEditingSubsede(null) });
    }
  }

  function handleConfirmDelete() {
    if (!deletingSubsede) return;

    setDeleteError(null);
    deleteSubsede.mutate(deletingSubsede?.id, {
      onSuccess: () => setDeletingSubsede(null),
      onError: (error) => {
        setDeleteError(
          error.response?.status === 403
            ? 'No se puede eliminar: esta subsede tiene ubicaciones de formación asociadas.'
            : 'No se pudo eliminar la subsede. Intenta de nuevo.'
        );
      },
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Subsedes</h1>
        <button
          onClick={() => setEditingSubsede({})}
          className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark"
        >
          Nueva subsede
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="filtro-sede" className="mr-2 text-sm text-slate-600">
          Filtrar por sede:
        </label>
        <select
          id="filtro-sede"
          value={sedeFiltro}
          onChange={(event) => {
            setSedeFiltro(event.target.value);
            setPage(1);
          }}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="">Todas las sedes</option>
          {sedesData?.data.map((sede) => (
            <option key={sede.id} value={sede.id}>
              {sede.nombre}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Cargando subsedes...</p>}
      {isError && <p className="text-sm text-danger">No se pudieron cargar las subsedes.</p>}

      {data && (
        <>
          <SubsedeTable
            subsedes={data.data}
            onEdit={setEditingSubsede}
            onDelete={(subsede) => {
              setDeleteError(null);
              setDeletingSubsede(subsede);
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

      {editingSubsede !== null && (
        <Modal title={editingSubsede.id ? 'Editar subsede' : 'Nueva subsede'} onClose={() => setEditingSubsede(null)}>
          <SubsedeForm
            initialValues={editingSubsede.id ? editingSubsede : null}
            onSubmit={handleSubmit}
            onCancel={() => setEditingSubsede(null)}
            isSubmitting={createSubsede.isPending || updateSubsede.isPending}
            serverErrors={serverErrors}
          />
        </Modal>
      )}

      <ConfirmDialog
        open={!!deletingSubsede}
        title="¿Eliminar esta subsede?"
        description={
          deleteError ?? `Esta acción no se puede deshacer${deletingSubsede ? `: "${deletingSubsede.nombre}"` : ''}.`
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingSubsede(null)}
        isLoading={deleteSubsede.isPending}
      />
    </div>
  );
}