import { useState } from 'react';
import {
  useTiposEquipo,
  useCreateTipoEquipo,
  useUpdateTipoEquipo,
  useDeleteTipoEquipo,
} from '../hooks/useTiposEquipo';
import { TipoEquipoTable } from '../components/TipoEquipoTable';
import { TipoEquipoForm } from '../components/TipoEquipoForm';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';

export function TiposEquipoPage() {
  const [editingTipo, setEditingTipo] = useState(null);
  const [deletingTipo, setDeletingTipo] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const { data: tipos, isLoading, isError } = useTiposEquipo();
  const createTipo = useCreateTipoEquipo();
  const updateTipo = useUpdateTipoEquipo();
  const deleteTipo = useDeleteTipoEquipo();

  const serverErrors = createTipo.error?.response?.data?.errors ?? updateTipo.error?.response?.data?.errors;

  function handleSubmit(payload) {
    if (editingTipo?.id) {
      updateTipo.mutate({ id: editingTipo.id, payload }, { onSuccess: () => setEditingTipo(null) });
    } else {
      createTipo.mutate(payload, { onSuccess: () => setEditingTipo(null) });
    }
  }

  function handleConfirmDelete() {
    if (!deletingTipo) return;

    setDeleteError(null);
    deleteTipo.mutate(deletingTipo?.id, {
      onSuccess: () => setDeletingTipo(null),
      onError: (error) => {
        setDeleteError(
          error.response?.status === 403
            ? 'No se puede eliminar: tiene equipos asociados. Considera desactivarlo en su lugar.'
            : 'No se pudo eliminar el tipo de equipo. Intenta de nuevo.'
        );
      },
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Tipos de Equipo</h1>
        <button
          onClick={() => setEditingTipo({})}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Nuevo tipo
        </button>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Cargando tipos de equipo...</p>}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar los tipos de equipo.</p>}

      {tipos && (
        <TipoEquipoTable
          tipos={tipos}
          onEdit={setEditingTipo}
          onDelete={(tipo) => {
            setDeleteError(null);
            setDeletingTipo(tipo);
          }}
        />
      )}

      {editingTipo !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              {editingTipo.id ? 'Editar tipo de equipo' : 'Nuevo tipo de equipo'}
            </h2>
            <TipoEquipoForm
              initialValues={editingTipo.id ? editingTipo : null}
              onSubmit={handleSubmit}
              onCancel={() => setEditingTipo(null)}
              isSubmitting={createTipo.isPending || updateTipo.isPending}
              serverErrors={serverErrors}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deletingTipo}
        title="¿Eliminar este tipo de equipo?"
        description={deleteError ?? `Esta acción no se puede deshacer${deletingTipo ? `: "${deletingTipo.nombre}"` : ''}.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingTipo(null)}
        isLoading={deleteTipo.isPending}
      />
    </div>
  );
}
