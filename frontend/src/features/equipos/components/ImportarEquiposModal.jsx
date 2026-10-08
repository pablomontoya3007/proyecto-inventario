import { useState } from 'react';
import { useImportarEquipos } from '../hooks/useEquipos';
import { descargarPlantillaImportacion } from '../services/equiposApi';
import { ResumenImportacion } from '../../../shared/components/ResumenImportacion';

const ETIQUETAS_RESUMEN = {
  importados: 'Equipos importados',
  yaRegistrados: 'Ya estaban registrados',
  listaYaRegistrados: 'Ver equipos que ya estaban registrados (se omitieron)',
};

/**
 * El resultado se queda visible después de subir (no se cierra solo):
 * si hay filas con errores, la persona necesita ver cuáles corregir.
 */
export function ImportarEquiposModal({ onClose }) {
  const [archivo, setArchivo] = useState(null);
  const [descargandoPlantilla, setDescargandoPlantilla] = useState(false);
  const importar = useImportarEquipos();

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

  return (
    <div className="space-y-4">
      {!resultado && (
        <>
          <p className="text-sm text-slate-600">
            El archivo debe tener las columnas: Placa SENA, Serial, MAC, MAC Cableada, Hostname, Tipo de equipo,
            Responsable, Sede, Subsede, Ambiente y Estado. Cualquier columna adicional (ej. "RAM (GB)", "Procesador")
            se guarda como característica técnica del equipo.
          </p>

          <p className="text-sm text-slate-600">
            Los equipos que ya estén registrados (misma placa o serial) se omiten automáticamente, así que puedes
            volver a subir un Excel completo sin problema. Tipo de equipo, Sede, Subsede y Ambiente deben coincidir con
            nombres ya registrados; si el responsable no existe, el equipo queda sin asignar.
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
            <label htmlFor="archivo-importar" className="block text-sm font-medium text-ink">
              Archivo Excel (.xlsx o .xls)
            </label>
            <input
              id="archivo-importar"
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => setArchivo(event.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-sena-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-sena-dark hover:file:bg-sena/20"
            />
          </div>
        )}

        {importar.isError && (
          <p className="rounded bg-danger/10 px-3 py-2 text-sm text-danger">
            No se pudo procesar el archivo. Revisa que sea un Excel válido e intenta de nuevo.
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