import { Modal } from './Modal';

/**
 * Ahora construido sobre Modal, en vez de tener su propio <div
 * fixed...> por separado — así hereda gratis el cierre con Escape, el
 * foco atrapado y los atributos ARIA sin duplicar esa lógica aquí.
 */
export function ConfirmDialog({ open, title, description, confirmLabel = 'Eliminar', onConfirm, onCancel, isLoading }) {
  if (!open) return null;

  return (
    <Modal title={title} onClose={onCancel} maxWidth="max-w-sm">
      {description && <p className="mb-6 text-sm text-slate-600">{description}</p>}

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="rounded bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger-dark disabled:opacity-50"
        >
          {isLoading ? 'Eliminando...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}