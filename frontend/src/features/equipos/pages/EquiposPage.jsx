import { useState } from 'react';
import { useEquipos, useCreateEquipo, useUpdateEquipo, useDeleteEquipo } from '../hooks/useEquipos';
import { useTiposEquipo } from '../../tipos-equipo/hooks/useTiposEquipo';
import { useSedes } from '../../sedes/hooks/useSedes';
import { useSubsedes } from '../../subsedes/hooks/useSubsedes';
import { useUbicaciones } from '../../ubicaciones/hooks/useUbicaciones';
import { EquipoTable } from '../components/EquipoTable';
import { EquipoForm } from '../components/EquipoForm';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';

export function EquiposPage() {
  const [page, setPage] = useState(1);
  const [placaFiltro, setPlacaFiltro] = useState('');
  const [serialFiltro, setSerialFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [sedeFiltro, setSedeFiltro] = useState('');
  const [subsedeFiltro, setSubsedeFiltro] = useState('');
  const [ubicacionFiltro, setUbicacionFiltro] = useState('');

  const [editingEquipo, setEditingEquipo] = useState(null);
  const [deletingEquipo, setDeletingEquipo] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // ubicacion_formacion_id ya implica subsede/sede, así que si está
  // elegida se manda solo ella — más preciso que combinar los tres.
  const filtros = {
    ...(placaFiltro ? { placa_sena: placaFiltro } : {}),
    ...(serialFiltro ? { serial: serialFiltro } : {}),
    ...(tipoFiltro ? { tipo_equipo_id: tipoFiltro } : {}),
    ...(ubicacionFiltro
      ? { ubicacion_formacion_id: ubicacionFiltro }
      : subsedeFiltro
        ? { subsede_id: subsedeFiltro }
        : sedeFiltro
          ? { sede_id: sedeFiltro }
          : {}),
  };

  const { data, isLoading, isError } = useEquipos(filtros, page);
  const { data: tiposData } = useTiposEquipo();
  const { data: sedesData } = useSedes(1);
  const { data: subsedesData } = useSubsedes({ page: 1, sedeId: sedeFiltro || undefined });
  const { data: ubicacionesData } = useUbicaciones({ page: 1, subsedeId: subsedeFiltro || undefined });

  const createEquipo = useCreateEquipo();
  const updateEquipo = useUpdateEquipo();
  const deleteEquipo = useDeleteEquipo();

  const serverErrors = createEquipo.error?.response?.data?.errors ?? updateEquipo.error?.response?.data?.errors;

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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Equipos</h1>
        <button
          onClick={() => setEditingEquipo({})}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Nuevo equipo
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Placa SENA..."
          value={placaFiltro}
          onChange={(event) => {
            setPlacaFiltro(event.target.value);
            setPage(1);
          }}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        />
        <input
          type="text"
          placeholder="Serial..."
          value={serialFiltro}
          onChange={(event) => {
            setSerialFiltro(event.target.value);
            setPage(1);
          }}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        />
        <select
          value={tipoFiltro}
          onChange={(event) => {
            setTipoFiltro(event.target.value);
            setPage(1);
          }}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="">Todos los tipos</option>
          {tiposData?.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nombre}
            </option>
          ))}
        </select>
        <select
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
        <select
          value={subsedeFiltro}
          disabled={!sedeFiltro}
          onChange={handleSubsedeFiltroChange}
          className="rounded border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-100"
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
          className="rounded border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-100"
        >
          <option value="">Todas las ubicaciones</option>
          {ubicacionesData?.data.map((ubicacion) => (
            <option key={ubicacion.id} value={ubicacion.id}>
              {ubicacion.nombre}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Cargando equipos...</p>}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar los equipos.</p>}

      {data && (
        <>
          <EquipoTable
            equipos={data.data}
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          {/* Modal más ancho que los anteriores (max-w-2xl + scroll
              interno): el formulario de Equipo tiene bastantes más
              campos que Sede/Subsede/Ubicación. */}
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              {editingEquipo.id ? 'Editar equipo' : 'Nuevo equipo'}
            </h2>
            <EquipoForm
              initialValues={editingEquipo.id ? editingEquipo : null}
              onSubmit={handleSubmit}
              onCancel={() => setEditingEquipo(null)}
              isSubmitting={createEquipo.isPending || updateEquipo.isPending}
              serverErrors={serverErrors}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deletingEquipo}
        title="¿Eliminar este equipo?"
        description={
          deleteError ??
          `Esta acción no se puede deshacer${
            deletingEquipo ? `: "${deletingEquipo.placa_sena}"` : ''
          }. También se eliminará su licencia de Office y todo su historial de observaciones.`
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingEquipo(null)}
        isLoading={deleteEquipo.isPending}
      />
    </div>
  );
}
