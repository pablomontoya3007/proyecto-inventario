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
import { Modal } from '../../../shared/components/Modal';

// Confirmado contra app/Enums/EstadoEquipo.php — mismos valores que ya
// usa EquipoForm.jsx.
const ESTADOS_EQUIPO = [
  { value: 'activo', label: 'Activo' },
  { value: 'mantenimiento', label: 'En mantenimiento' },
  { value: 'de_baja', label: 'De baja' },
  { value: 'extraviado', label: 'Extraviado' },
];

export function TiposEquipoPage() {
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [editingTipo, setEditingTipo] = useState(null);
  const [deletingTipo, setDeletingTipo] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const { data: tipos, isLoading, isError } = useTiposEquipo(estadoFiltro || undefined);
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink">Tipos de Equipo</h1>
        <button
          onClick={() => setEditingTipo({})}
          className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark"
        >
          Nuevo tipo
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="filtro-estado-tipo" className="mr-2 text-sm text-slate-600">
          Contar equipos en estado:
        </label>
        <select
          id="filtro-estado-tipo"
          value={estadoFiltro}
          onChange={(event) => setEstadoFiltro(event.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm focus:border-sena focus:outline-none focus:ring-1 focus:ring-sena"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_EQUIPO.map((estado) => (
            <option key={estado.value} value={estado.value}>
              {estado.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Cargando tipos de equipo...</p>}
      {isError && <p className="text-sm text-danger">No se pudieron cargar los tipos de equipo.</p>}

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
        <Modal title={editingTipo.id ? 'Editar tipo de equipo' : 'Nuevo tipo de equipo'} onClose={() => setEditingTipo(null)}>
          <TipoEquipoForm
            initialValues={editingTipo.id ? editingTipo : null}
            onSubmit={handleSubmit}
            onCancel={() => setEditingTipo(null)}
            isSubmitting={createTipo.isPending || updateTipo.isPending}
            serverErrors={serverErrors}
          />
        </Modal>
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
