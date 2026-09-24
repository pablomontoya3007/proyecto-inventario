import { useState } from 'react';
import { useTraslados, useCreateTraslado } from '../hooks/useTraslados';
import { useSedes } from '../../sedes/hooks/useSedes';
import { useSubsedes } from '../../subsedes/hooks/useSubsedes';
import { useUbicaciones } from '../../ubicaciones/hooks/useUbicaciones';
import { FiltroUbicacionCascada } from '../../../shared/components/FiltroUbicacionCascada';
import { TrasladoTable } from '../components/TrasladoTable';
import { TrasladoForm } from '../components/TrasladoForm';
import { Modal } from '../../../shared/components/Modal';

export function TrasladosPage() {
  const [page, setPage] = useState(1);
  const [sedeFiltro, setSedeFiltro] = useState('');
  const [subsedeFiltro, setSubsedeFiltro] = useState('');
  const [ubicacionFiltro, setUbicacionFiltro] = useState('');
  const [creando, setCreando] = useState(false);

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

  // Un traslado cae en el filtro si su ubicación de ORIGEN o de DESTINO
  // coincide (ver Traslado::scopeFiltrarPorUbicacion en el backend).
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

  const { data, isLoading, isError } = useTraslados(page, filtros);
  const createTraslado = useCreateTraslado();

  const serverErrors = createTraslado.error?.response?.data?.errors;

  function handleSubmit(payload) {
    createTraslado.mutate(payload, { onSuccess: () => setCreando(false) });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink">Traslados</h1>
        <button
          onClick={() => setCreando(true)}
          className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark"
        >
          Registrar traslado
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

      {isLoading && <p className="text-sm text-slate-500">Cargando...</p>}
      {isError && <p className="text-sm text-danger">No se pudieron cargar los traslados.</p>}

      {data && (
        <>
          <TrasladoTable traslados={data.data} />

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

      {creando && (
        <Modal title="Registrar traslado" onClose={() => setCreando(false)} maxWidth="max-w-xl">
          <TrasladoForm
            onSubmit={handleSubmit}
            onCancel={() => setCreando(false)}
            isSubmitting={createTraslado.isPending}
            serverErrors={serverErrors}
          />
        </Modal>
      )}
    </div>
  );
}
