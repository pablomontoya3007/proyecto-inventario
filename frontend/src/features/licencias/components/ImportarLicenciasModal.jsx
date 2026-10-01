import { useState } from 'react';
import { useImportarLicencias } from '../hooks/useLicencias';
import { descargarPlantillaImportacion } from '../services/licenciasApi';

/**
 * Mismo comportamiento que ImportarEquiposModal: el resultado se queda
 * visible después de subir (no se cierra solo), para que la persona lea
 * qué filas fallaron y por qué antes de decidir qué hacer.
 *
 * Diferencia: aviso explícito de que el archivo contiene contraseñas en
 * texto plano — una vez importado, el sistema ya las guarda cifradas y
 * el Excel es la única copia legible que queda por ahí.
 */
export function ImportarLicenciasModal({ onClose }) {
  const [archivo, setArchivo] = useState(null);
  const [descargandoPlantilla, setDescargandoPlantilla] = useState(false);
  const importar = useImportarLicencias();

  async function handleDescargarPlantilla() {
    setDescargandoPlantilla(true);
    try {
      await descargarPlantillaImportacion();
    } finally {
      setDescargandoPlantilla(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!archivo) return;
    importar.mutate(archivo);
  }

  const resultado = importar.data;
  const errorArchivo = importar.error?.response?.data?.errors?.archivo?.[0];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        El archivo debe tener las columnas: Placa SENA, Correo, Contraseña y Estado. La placa debe corresponder a un
        equipo ya registrado, y cada equipo puede tener una sola licencia. Estado es opcional (activa, vencida o
        suspendida); si se deja vacío, la licencia queda activa.
      </p>

      <p className="rounded border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-ink">
        El archivo contiene contraseñas sin cifrar. Después de importarlo, elimínalo de tu equipo y de cualquier
        carpeta compartida: el sistema ya las guarda cifradas.
      </p>

      <button
        type="button"
        onClick={handleDescargarPlantilla}
        disabled={descargandoPlantilla}
        className="text-sm font-medium text-sena underline hover:text-sena-dark disabled:opacity-50"
      >
        {descargandoPlantilla ? 'Generando...' : 'Descargar plantilla de ejemplo'}
      </button>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="archivo-importar-licencias" className="block text-sm font-medium text-ink">
            Archivo Excel (.xlsx o .xls)
          </label>
          <input
            id="archivo-importar-licencias"
            type="file"
            accept=".xlsx,.xls"
            onChange={(event) => setArchivo(event.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-sena-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-sena-dark hover:file:bg-sena/20"
          />
        </div>

        {importar.isError && (
          <p className="rounded bg-danger/10 px-3 py-2 text-sm text-danger">
            {errorArchivo ?? 'No se pudo procesar el archivo. Revisa que sea un Excel válido e intenta de nuevo.'}
          </p>
        )}

        {resultado && (
          <div className="rounded border border-slate-200 bg-surface p-3 text-sm">
            <p className="font-medium text-sena-dark">
              {resultado.importados} licencia(s) importada(s) correctamente.
            </p>
            {resultado.fallidos > 0 && (
              <>
                <p className="mt-1 font-medium text-danger">{resultado.fallidos} fila(s) con errores:</p>
                <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                  {resultado.errores.map((error, indice) => (
                    <li key={indice} className="text-slate-600">
                      Fila <span className="font-mono">{error.fila}</span> ({error.campo}): {error.errores.join(' ')}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-surface">
            {resultado ? 'Cerrar' : 'Cancelar'}
          </button>
          <button
            type="submit"
            disabled={!archivo || importar.isPending}
            className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark disabled:opacity-50"
          >
            {importar.isPending ? 'Importando...' : 'Importar'}
          </button>
        </div>
      </form>
    </div>
  );
}