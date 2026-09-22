import { useState } from 'react';
import { useLicencias, useCreateLicencia, useUpdateLicencia, useDeleteLicencia } from '../hooks/useLicencias';
import { useSedes } from '../../sedes/hooks/useSedes';
import { useSubsedes } from '../../subsedes/hooks/useSubsedes';
import { useUbicaciones } from '../../ubicaciones/hooks/useUbicaciones';
import { FiltroUbicacionCascada } from '../../../shared/components/FiltroUbicacionCascada';
import { LicenciaTable } from '../components/LicenciaTable';
import { LicenciaForm } from '../components/LicenciaForm';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Modal } from '../../../shared/components/Modal';

export function LicenciasPage() {
  const [page, setPage] = useState(1);
  const [sedeFiltro, setSedeFiltro] = useState('');
  const [subsedeFiltro, setSubsedeFiltro] = useState('');
  const [ubicacionFiltro, setUbicacionFiltro] = useState('');

  const [editingLicencia, setEditingLicencia] = useState(null);
  const [deletingLicencia, setDeletingLicencia] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

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

  const { data, isLoading, isError } = useLicencias(page, filtros);
  const createLicencia = useCreateLicencia();
  const updateLicencia = useUpdateLicencia();
  const deleteLicencia = useDeleteLicencia();

  const serverErrors = createLicencia.error?.response?.data?.errors ?? updateLicencia.error?.response?.data?.errors;

  function handleSubmit(payload) {
    if (editingLicencia?.id) {
      updateLicencia.mutate({ id: editingLicencia.id, payload }, { onSuccess: () => setEditingLicencia(null) });
    } else {
      createLicencia.mutate(payload, { onSuccess: () => setEditingLicencia(null) });
    }
  }

  function handleConfirmDelete() {
    if (!deletingLicencia) return;

    setDeleteError(null);
    deleteLicencia.mutate(deletingLicencia?.id, {
      onSuccess: () => setDeletingLicencia(null),
      onError: () => setDeleteError('No se pudo eliminar la licencia. Intenta de nuevo.'),
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Licencias de Office</h1>
        <button
          onClick={() => setEditingLicencia({})}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Nueva licencia
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

      {isLoading && <p className="text-sm text-slate-500">Cargando licencias...</p>}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar las licencias.</p>}

      {data && (
        <>
          <LicenciaTable
            licencias={data.data}
            onEdit={setEditingLicencia}
            onDelete={(licencia) => {
              setDeleteError(null);
              setDeletingLicencia(licencia);
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

      {editingLicencia !== null && (
        <Modal title={editingLicencia.id ? 'Editar licencia' : 'Nueva licencia'} onClose={() => setEditingLicencia(null)}>
          <LicenciaForm
            initialValues={editingLicencia.id ? editingLicencia : null}
            onSubmit={handleSubmit}
            onCancel={() => setEditingLicencia(null)}
            isSubmitting={createLicencia.isPending || updateLicencia.isPending}
            serverErrors={serverErrors}
          />
        </Modal>
      )}

      <ConfirmDialog
        open={!!deletingLicencia}
        title="¿Eliminar esta licencia?"
        description={
          deleteError ?? `Esta acción no se puede deshacer${deletingLicencia ? `: "${deletingLicencia.correo}"` : ''}.`
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingLicencia(null)}
        isLoading={deleteLicencia.isPending}
      />
    </div>
  );
}