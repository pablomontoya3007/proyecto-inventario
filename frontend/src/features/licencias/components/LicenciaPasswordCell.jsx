import { useState } from 'react';
import { fetchLicenciaPassword } from '../services/licenciasApi';

/**
 * Componente propio (no una función suelta dentro del .map de la tabla)
 * porque necesita su propio estado por fila — useState no se puede
 * llamar dentro de un callback de .map() directamente, solo dentro de
 * un componente. Cada fila pide y muestra su contraseña de forma
 * completamente independiente de las demás.
 */
export function LicenciaPasswordCell({ licenciaId }) {
  const [password, setPassword] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [copiado, setCopiado] = useState(false);

  async function handleToggle() {
    if (password) {
      setPassword(null); // ocultar de nuevo
      return;
    }

    setError(null);
    setCargando(true);
    try {
      const valor = await fetchLicenciaPassword(licenciaId);
      setPassword(valor);
    } catch {
      setError('No se pudo obtener.');
    } finally {
      setCargando(false);
    }
  }

  async function handleCopiar() {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-slate-700">{password ?? '••••••••'}</span>
      <button
        type="button"
        onClick={handleToggle}
        disabled={cargando}
        className="text-xs text-slate-500 hover:underline disabled:opacity-50"
      >
        {cargando ? '...' : password ? 'Ocultar' : 'Mostrar'}
      </button>
      {password && (
        <button type="button" onClick={handleCopiar} className="text-xs text-slate-500 hover:underline">
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
