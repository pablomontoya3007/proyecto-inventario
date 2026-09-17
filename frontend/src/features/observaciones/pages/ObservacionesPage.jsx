import { useState } from 'react';
import { useObservaciones, useCreateObservacion } from '../hooks/useObservaciones';
import { useEquipos } from '../../equipos/hooks/useEquipos';
import { ObservacionList } from '../components/ObservacionList';
import { ObservacionForm } from '../components/ObservacionForm';
import { Modal } from '../../../shared/components/Modal';

export function ObservacionesPage() {
  const [page, setPage] = useState(1);
  const [equipoFiltro, setEquipoFiltro] = useState('');
  const [creandoObservacion, setCreandoObservacion] = useState(false);

  const { data, isLoading, isError } = useObservaciones({ page, equipoId: equipoFiltro || undefined });
  const { data: equiposData } = useEquipos({}, 1);
  const createObservacion = useCreateObservacion();

  const serverErrors = createObservacion.error?.response?.data?.errors;

  function handleSubmit(payload) {
    createObservacion.mutate(payload, { onSuccess: () => setCreandoObservacion(false) });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Observaciones</h1>
        <button
          onClick={() => setCreandoObservacion(true)}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Nueva observación
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="filtro-equipo-obs" className="mr-2 text-sm text-slate-600">
          Equipo:
        </label>
        <select
          id="filtro-equipo-obs"
          value={equipoFiltro}
          onChange={(event) => {
            setEquipoFiltro(event.target.value);
            setPage(1);
          }}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="">Todos los equipos</option>
          {equiposData?.data.map((equipo) => (
            <option key={equipo.id} value={equipo.id}>
              {equipo.placa_sena}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Cargando observaciones...</p>}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar las observaciones.</p>}

      {data && (
        <>
          <ObservacionList observaciones={data.data} mostrarEquipo={!equipoFiltro} />

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

      {creandoObservacion && (
        <Modal title="Nueva observación" onClose={() => setCreandoObservacion(false)}>
          <ObservacionForm
            equipoIdInicial={equipoFiltro}
            onSubmit={handleSubmit}
            onCancel={() => setCreandoObservacion(false)}
            isSubmitting={createObservacion.isPending}
            serverErrors={serverErrors}
          />
        </Modal>
      )}
    </div>
  );
}