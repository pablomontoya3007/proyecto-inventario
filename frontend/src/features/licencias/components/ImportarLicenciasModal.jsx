import { useState } from 'react';
import { useImportarLicencias } from '../hooks/useLicencias';
import { descargarPlantillaImportacion } from '../services/licenciasApi';
import { ResumenImportacion } from '../../../shared/components/ResumenImportacion';

const ETIQUETAS_RESUMEN = {
  importados: 'Licencias importadas',
  yaRegistrados: 'Equipos que ya tenían licencia',
  listaYaRegistrados: 'Ver equipos que ya tenían licencia (se omitieron)',
};

/**
 * Mismo comportamiento que ImportarEquiposModal. Diferencia: aviso de
 * que el archivo contiene contraseñas en texto plano.
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
      {!resultado && (
        <>
          <p className="text-sm text-slate-600">
            El archivo debe tener las columnas: Placa SENA, Correo, Contraseña y Estado. La placa debe corresponder a
            un equipo ya registrado. Los equipos que ya tengan licencia se omiten automáticamente. Estado es opcional
            (activa, vencida o suspendida); si se deja vacío, la licencia queda activa.
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
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!resultado && (
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
        )}

        {importar.isError && (
          <p className="rounded bg-danger/10 px-3 py-2 text-sm text-danger">
            {errorArchivo ?? 'No se pudo procesar el archivo. Revisa que sea un Excel válido e intenta de nuevo.'}
          </p>
        )}

        {resultado && <ResumenImportacion resultado={resultado} etiquetas={ETIQUETAS_RESUMEN} />}

        <div className="flex justify-end gap-2">
          {resultado ? (
            <>
              <button
                type="button"
                onClick={() => {
                  importar.reset();
                  setArchivo(null);
                }}
                className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-surface"
              >
                Importar otro archivo
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark"
              >
                Cerrar
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={onClose} className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-surface">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!archivo || importar.isPending}
                className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark disabled:opacity-50"
              >
                {importar.isPending ? 'Importando...' : 'Importar'}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}