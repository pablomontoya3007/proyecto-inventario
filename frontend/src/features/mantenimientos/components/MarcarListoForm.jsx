import { useState } from 'react';

export function MarcarListoForm({ onSubmit, onCancel, isSubmitting }) {
  const [nota, setNota] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(nota.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nota_finalizacion" className="block text-sm font-medium text-slate-700">
          ¿Algún detalle importante?
        </label>
        <textarea
          id="nota_finalizacion"
          maxLength={500}
          rows={3}
          value={nota}
          onChange={(event) => setNota(event.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : 'Marcar como listo'}
        </button>
      </div>
    </form>
  );
}
