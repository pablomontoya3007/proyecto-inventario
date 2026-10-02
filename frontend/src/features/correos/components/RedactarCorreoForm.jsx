import { useState } from 'react';
import { SelectorDestinatarios } from './SelectorDestinatarios';

const INPUT = 'mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sena focus:outline-none';
const MAX_CUERPO = 10000;

/**
 * initialValues permite abrir el formulario ya lleno (botón
 * "Reintentar" de un correo fallido en el historial).
 *
 * errorEnvio: mensaje cuando el backend registró el correo como
 * "fallido" o hubo un error de red/límite. El formulario NO se vacía,
 * para que la persona pueda reintentar sin volver a escribir todo.
 */
export function RedactarCorreoForm({ initialValues, onSubmit, onCancel, isSubmitting, serverErrors, errorEnvio }) {
  const [destinatarios, setDestinatarios] = useState(initialValues?.destinatarios ?? []);
  const [asunto, setAsunto] = useState(initialValues?.asunto ?? '');
  const [cuerpo, setCuerpo] = useState(initialValues?.cuerpo ?? '');
  const [faltanDestinatarios, setFaltanDestinatarios] = useState(false);

  const errorDestinatarios = serverErrors
    ? (serverErrors.destinatarios?.[0] ??
      Object.entries(serverErrors).find(([campo]) => campo.startsWith('correos') || campo.startsWith('usuario_ids'))?.[1]?.[0])
    : null;

  function handleSubmit(event) {
    event.preventDefault();

    if (destinatarios.length === 0) {
      setFaltanDestinatarios(true);
      return;
    }

    onSubmit({
      usuario_ids: destinatarios.filter((d) => d.usuarioId).map((d) => d.usuarioId),
      correos: destinatarios.filter((d) => !d.usuarioId).map((d) => d.correo),
      asunto: asunto.trim(),
      cuerpo,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="correo_destinatarios" className="block text-sm font-medium text-ink">
          Para
        </label>
        <div className="mt-1">
          <SelectorDestinatarios
            id="correo_destinatarios"
            value={destinatarios}
            onChange={(nuevos) => {
              setDestinatarios(nuevos);
              setFaltanDestinatarios(false);
            }}
          />
        </div>
        {faltanDestinatarios && <p className="mt-1 text-sm text-danger">Agrega al menos un destinatario.</p>}
        {errorDestinatarios && <p className="mt-1 text-sm text-danger">{errorDestinatarios}</p>}
      </div>

      <div>
        <label htmlFor="correo_asunto" className="block text-sm font-medium text-ink">
          Asunto
        </label>
        <input
          id="correo_asunto"
          type="text"
          required
          maxLength={200}
          value={asunto}
          onChange={(event) => setAsunto(event.target.value)}
          className={INPUT}
        />
        {serverErrors?.asunto && <p className="mt-1 text-sm text-danger">{serverErrors.asunto[0]}</p>}
      </div>

      <div>
        <label htmlFor="correo_cuerpo" className="block text-sm font-medium text-ink">
          Mensaje
        </label>
        <textarea
          id="correo_cuerpo"
          required
          rows={10}
          maxLength={MAX_CUERPO}
          value={cuerpo}
          onChange={(event) => setCuerpo(event.target.value)}
          className={INPUT}
        />
        <div className="mt-1 flex justify-between text-xs text-slate-500">
          <span>Las respuestas a este correo te llegarán a ti.</span>
          <span>
            {cuerpo.length.toLocaleString('es-CO')} / {MAX_CUERPO.toLocaleString('es-CO')}
          </span>
        </div>
        {serverErrors?.cuerpo && <p className="mt-1 text-sm text-danger">{serverErrors.cuerpo[0]}</p>}
      </div>

      {errorEnvio && <p className="rounded bg-danger/10 px-3 py-2 text-sm text-danger">{errorEnvio}</p>}

      <div className="flex justify-end gap-2 border-t pt-4">
        <button type="button" onClick={onCancel} className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark disabled:opacity-50"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar correo'}
        </button>
      </div>
    </form>
  );
}