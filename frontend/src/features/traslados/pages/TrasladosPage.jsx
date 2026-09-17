import { useState } from 'react';
import { useTraslados, useCreateTraslado } from '../hooks/useTraslados';
import { TrasladoTable } from '../components/TrasladoTable';
import { TrasladoForm } from '../components/TrasladoForm';
import { Modal } from '../../../shared/components/Modal';

export function TrasladosPage() {
  const [page, setPage] = useState(1);
  const [creando, setCreando] = useState(false);

  const { data, isLoading, isError } = useTraslados(page);
  const createTraslado = useCreateTraslado();

  const serverErrors = createTraslado.error?.response?.data?.errors;

  function handleSubmit(payload) {
    createTraslado.mutate(payload, { onSuccess: () => setCreando(false) });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Traslados</h1>
        <button
          onClick={() => setCreando(true)}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Registrar traslado
        </button>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Cargando...</p>}
      {isError && <p className="text-sm text-red-600">No se pudieron cargar los traslados.</p>}

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
