import { useState } from 'react';
import { useCorreos, useEnviarCorreo } from '../hooks/useCorreos';
import { CorreoTable } from '../components/CorreoTable';
import { DetalleCorreo } from '../components/DetalleCorreo';
import { RedactarCorreoForm } from '../components/RedactarCorreoForm';
import { Modal } from '../../../shared/components/Modal';

const CAMPO =
  'rounded border border-slate-300 px-3 py-2 text-sm focus:border-sena focus:outline-none focus:ring-1 focus:ring-sena';

const ESTADOS_CORREO = [
  { value: 'enviado', label: 'Enviado' },
  { value: 'fallido', label: 'Fallido' },
];

export function CorreosPage() {
  const [page, setPage] = useState(1);
  const [asuntoFiltro, setAsuntoFiltro] = useState('');
  const [destinatarioFiltro, setDestinatarioFiltro] = useState('');
  const [remitenteFiltro, setRemitenteFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [fechaDesdeFiltro, setFechaDesdeFiltro] = useState('');
  const [fechaHastaFiltro, setFechaHastaFiltro] = useState('');

  // null = cerrado; objeto = abierto (vacío o con un borrador para reintentar)
  const [redactando, setRedactando] = useState(null);
  const [viendoCorreo, setViendoCorreo] = useState(null);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [aviso, setAviso] = useState(null);

  const filtros = {
    ...(asuntoFiltro ? { asunto: asuntoFiltro } : {}),
    ...(destinatarioFiltro ? { destinatario: destinatarioFiltro } : {}),
    ...(remitenteFiltro ? { remitente: remitenteFiltro } : {}),
    ...(estadoFiltro ? { estado: estadoFiltro } : {}),
    ...(fechaDesdeFiltro ? { fecha_desde: fechaDesdeFiltro } : {}),
    ...(fechaHastaFiltro ? { fecha_hasta: fechaHastaFiltro } : {}),
  };
  const hayFiltrosActivos = Object.keys(filtros).length > 0;

  const { data, isLoading, isError } = useCorreos({ page, filtros });
  const enviar = useEnviarCorreo();

  const serverErrors = enviar.error?.response?.status === 422 ? enviar.error.response.data?.errors : null;

  function conFiltro(setter) {
    return (event) => {
      setter(event.target.value);
      setPage(1);
    };
  }

  function handleLimpiarFiltros() {
    setAsuntoFiltro('');
    setDestinatarioFiltro('');
    setRemitenteFiltro('');
    setEstadoFiltro('');
    setFechaDesdeFiltro('');
    setFechaHastaFiltro('');
    setPage(1);
  }

  function abrirRedactar(borrador = {}) {
    enviar.reset();
    setErrorEnvio(null);
    setAviso(null);
    setRedactando(borrador);
  }

  function handleReintentar(correo) {
    setViendoCorreo(null);
    abrirRedactar({
      destinatarios: correo.destinatarios.map((destinatario) => ({ correo: destinatario })),
      asunto: correo.asunto,
      cuerpo: correo.cuerpo,
    });
  }

  function handleEnviar(payload) {
    setErrorEnvio(null);

    enviar.mutate(payload, {
      onSuccess: (correo) => {
        if (correo.estado === 'enviado') {
          setRedactando(null);
          setAviso(`Correo enviado a ${correo.total_destinatarios} destinatario(s).`);
        } else {
          setErrorEnvio(
            'No se pudo enviar el correo (quedó registrado como fallido en el historial). ' +
              'Revisa la configuración de la cuenta de correo del sistema e intenta de nuevo.'
          );
        }
      },
      onError: (error) => {
        const status = error.response?.status;
        if (status === 429) {
          setErrorEnvio('Enviaste demasiados correos seguidos. Espera un minuto e intenta de nuevo.');
        } else if (status !== 422) {
          setErrorEnvio('No se pudo enviar el correo. Revisa tu conexión e intenta de nuevo.');
        }
      },
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink">Correos</h1>
        <button
          onClick={() => abrirRedactar()}
          className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark"
        >
          Redactar correo
        </button>
      </div>

      {aviso && (
        <div className="mb-4 flex items-center justify-between rounded bg-sena-soft px-4 py-2 text-sm text-sena-dark">
          <span>{aviso}</span>
          <button onClick={() => setAviso(null)} aria-label="Cerrar aviso" className="text-lg leading-none">
            ×
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded border border-slate-200 bg-white p-4">
        <div>
          <label htmlFor="filtro_correo_asunto" className="block text-xs text-slate-500">
            Asunto
          </label>
          <input
            id="filtro_correo_asunto"
            type="text"
            placeholder="Buscar en el asunto..."
            value={asuntoFiltro}
            onChange={conFiltro(setAsuntoFiltro)}
            className={CAMPO}
          />
        </div>

        <div>
          <label htmlFor="filtro_correo_destinatario" className="block text-xs text-slate-500">
            Destinatario
          </label>
          <input
            id="filtro_correo_destinatario"
            type="text"
            placeholder="Correo del destinatario..."
            value={destinatarioFiltro}
            onChange={conFiltro(setDestinatarioFiltro)}
            className={CAMPO}
          />
        </div>

        <div>
          <label htmlFor="filtro_correo_remitente" className="block text-xs text-slate-500">
            Enviado por
          </label>
          <input
            id="filtro_correo_remitente"
            type="text"
            placeholder="Nombre del usuario..."
            value={remitenteFiltro}
            onChange={conFiltro(setRemitenteFiltro)}
            className={CAMPO}
          />
        </div>

        <div>
          <label htmlFor="filtro_correo_estado" className="block text-xs text-slate-500">
            Estado
          </label>
          <select
            id="filtro_correo_estado"
            value={estadoFiltro}
            onChange={conFiltro(setEstadoFiltro)}
            className={CAMPO}
          >
            <option value="">Todos</option>
            {ESTADOS_CORREO.map((estado) => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filtro_correo_desde" className="block text-xs text-slate-500">
            Desde
          </label>
          <input
            id="filtro_correo_desde"
            type="date"
            value={fechaDesdeFiltro}
            max={fechaHastaFiltro || undefined}
            onChange={conFiltro(setFechaDesdeFiltro)}
            className={CAMPO}
          />
        </div>

        <div>
          <label htmlFor="filtro_correo_hasta" className="block text-xs text-slate-500">
            Hasta
          </label>
          <input
            id="filtro_correo_hasta"
            type="date"
            value={fechaHastaFiltro}
            min={fechaDesdeFiltro || undefined}
            onChange={conFiltro(setFechaHastaFiltro)}
            className={CAMPO}
          />
        </div>

        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={handleLimpiarFiltros}
            className="pb-2 text-sm text-slate-500 underline hover:text-ink"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {isLoading && <p className="text-sm text-slate-500">Cargando correos...</p>}
      {isError && <p className="text-sm text-danger">No se pudo cargar el historial de correos.</p>}

      {data && (
        <>
          <div className="rounded border border-slate-200 bg-white p-4">
            <CorreoTable correos={data.data} onVer={setViendoCorreo} />
          </div>

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

      {redactando !== null && (
        <Modal title="Redactar correo" onClose={() => setRedactando(null)} maxWidth="max-w-2xl">
          <RedactarCorreoForm
            initialValues={redactando}
            onSubmit={handleEnviar}
            onCancel={() => setRedactando(null)}
            isSubmitting={enviar.isPending}
            serverErrors={serverErrors}
            errorEnvio={errorEnvio}
          />
        </Modal>
      )}

      {viendoCorreo && (
        <Modal title="Detalle del correo" onClose={() => setViendoCorreo(null)} maxWidth="max-w-2xl">
          <DetalleCorreo correo={viendoCorreo} onReintentar={handleReintentar} onCerrar={() => setViendoCorreo(null)} />
        </Modal>
      )}
    </div>
  );
}