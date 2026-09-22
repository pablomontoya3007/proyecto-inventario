import { useState } from 'react';
import { useObservaciones, useCreateObservacion } from '../hooks/useObservaciones';
import { useSedes } from '../../sedes/hooks/useSedes';
import { useSubsedes } from '../../subsedes/hooks/useSubsedes';
import { useUbicaciones } from '../../ubicaciones/hooks/useUbicaciones';
import { FiltroUbicacionCascada } from '../../../shared/components/FiltroUbicacionCascada';
import { ObservacionList } from '../components/ObservacionList';
import { ObservacionForm } from '../components/ObservacionForm';
import { Modal } from '../../../shared/components/Modal';

export function ObservacionesPage() {
  const [page, setPage] = useState(1);
  const [placaFiltro, setPlacaFiltro] = useState('');
  const [usuarioFiltro, setUsuarioFiltro] = useState('');
  const [sedeFiltro, setSedeFiltro] = useState('');
  const [subsedeFiltro, setSubsedeFiltro] = useState('');
  const [ubicacionFiltro, setUbicacionFiltro] = useState('');
  const [creandoObservacion, setCreandoObservacion] = useState(false);

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
    ...(placaFiltro ? { placa_sena: placaFiltro } : {}),
    ...(usuarioFiltro ? { usuario: usuarioFiltro } : {}),
  };

  const { data: sedesData } = useSedes(1);
  const { data: subsedesData } = useSubsedes({ page: 1, sedeId: sedeFiltro || undefined });
  const { data: ubicacionesData } = useUbicaciones({ page: 1, subsedeId: subsedeFiltro || undefined });

  const { data, isLoading, isError } = useObservaciones({ page, filtros });
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

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por placa del equipo..."
          value={placaFiltro}
          onChange={(event) => {
            setPlacaFiltro(event.target.value);
            setPage(1);
          }}
          className="w-full max-w-sm rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Buscar por quién la registró..."
          value={usuarioFiltro}
          onChange={(event) => {
            setUsuarioFiltro(event.target.value);
            setPage(1);
          }}
          className="w-full max-w-sm rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      {isLoading && <p className="text-sm text-slate-500">Cargando observaciones...</p>}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar las observaciones.</p>}

      {data && (
        <>
          <ObservacionList observaciones={data.data} mostrarEquipo />

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