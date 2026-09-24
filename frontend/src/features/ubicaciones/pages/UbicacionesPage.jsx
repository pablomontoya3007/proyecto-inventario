import { useState } from 'react';
import { useUbicaciones, useCreateUbicacion, useUpdateUbicacion, useDeleteUbicacion } from '../hooks/useUbicaciones';
import { useSedes } from '../../sedes/hooks/useSedes';
import { useSubsedes } from '../../subsedes/hooks/useSubsedes';
import { UbicacionTable } from '../components/UbicacionTable';
import { UbicacionForm } from '../components/UbicacionForm';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Modal } from '../../../shared/components/Modal';

export function UbicacionesPage() {
  const [page, setPage] = useState(1);
  const [sedeFiltro, setSedeFiltro] = useState('');
  const [subsedeFiltro, setSubsedeFiltro] = useState('');
  const [editingUbicacion, setEditingUbicacion] = useState(null);
  const [deletingUbicacion, setDeletingUbicacion] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const { data, isLoading, isError } = useUbicaciones({ page, subsedeId: subsedeFiltro || undefined });
  const { data: sedesData } = useSedes(1);
  const { data: subsedesData } = useSubsedes({ page: 1, sedeId: sedeFiltro || undefined });

  const createUbicacion = useCreateUbicacion();
  const updateUbicacion = useUpdateUbicacion();
  const deleteUbicacion = useDeleteUbicacion();

  const serverErrors = createUbicacion.error?.response?.data?.errors ?? updateUbicacion.error?.response?.data?.errors;

  function handleSedeFiltroChange(event) {
    setSedeFiltro(event.target.value);
    setSubsedeFiltro(''); // cambiar de sede invalida el filtro de subsede
    setPage(1);
  }

  function handleSubmit(payload) {
    if (editingUbicacion?.id) {
      updateUbicacion.mutate({ id: editingUbicacion.id, payload }, { onSuccess: () => setEditingUbicacion(null) });
    } else {
      createUbicacion.mutate(payload, { onSuccess: () => setEditingUbicacion(null) });
    }
  }

  function handleConfirmDelete() {
    if (!deletingUbicacion) return;

    setDeleteError(null);
    deleteUbicacion.mutate(deletingUbicacion?.id, {
      onSuccess: () => setDeletingUbicacion(null),
      onError: (error) => {
        setDeleteError(
          error.response?.status === 403
            ? 'No se puede eliminar: esta ubicación tiene equipos asociados.'
            : 'No se pudo eliminar la ubicación. Intenta de nuevo.'
        );
      },
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Ubicaciones de Formación</h1>
        <button
          onClick={() => setEditingUbicacion({})}
          className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark"
        >
          Nueva ubicación
        </button>
      </div>

      <div className="mb-4 flex gap-4">
        <div>
          <label htmlFor="filtro-sede" className="mr-2 text-sm text-slate-600">
            Sede:
          </label>
          <select
            id="filtro-sede"
            value={sedeFiltro}
            onChange={handleSedeFiltroChange}
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

        <div>
          <label htmlFor="filtro-subsede" className="mr-2 text-sm text-slate-600">
            Subsede:
          </label>
          <select
            id="filtro-subsede"
            value={subsedeFiltro}
            disabled={!sedeFiltro}
            onChange={(event) => {
              setSubsedeFiltro(event.target.value);
              setPage(1);
            }}
            className="rounded border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-100"
          >
            <option value="">Todas las subsedes</option>
            {subsedesData?.data.map((subsede) => (
              <option key={subsede.id} value={subsede.id}>
                {subsede.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Cargando ubicaciones...</p>}
      {isError && <p className="text-sm text-danger">No se pudieron cargar las ubicaciones.</p>}

      {data && (
        <>
          <UbicacionTable
            ubicaciones={data.data}
            onEdit={setEditingUbicacion}
            onDelete={(ubicacion) => {
              setDeleteError(null);
              setDeletingUbicacion(ubicacion);
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

      {editingUbicacion !== null && (
        <Modal
          title={editingUbicacion.id ? 'Editar ubicación' : 'Nueva ubicación'}
          onClose={() => setEditingUbicacion(null)}
        >
          <UbicacionForm
            initialValues={editingUbicacion.id ? editingUbicacion : null}
            onSubmit={handleSubmit}
            onCancel={() => setEditingUbicacion(null)}
            isSubmitting={createUbicacion.isPending || updateUbicacion.isPending}
            serverErrors={serverErrors}
          />
        </Modal>
      )}

      <ConfirmDialog
        open={!!deletingUbicacion}
        title="¿Eliminar esta ubicación?"
        description={
          deleteError ?? `Esta acción no se puede deshacer${deletingUbicacion ? `: "${deletingUbicacion.nombre}"` : ''}.`
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingUbicacion(null)}
        isLoading={deleteUbicacion.isPending}
      />
    </div>
  );
}