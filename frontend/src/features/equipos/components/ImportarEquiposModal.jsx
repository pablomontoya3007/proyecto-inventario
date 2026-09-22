import { useState } from 'react';
import { useImportarEquipos } from '../hooks/useEquipos';
import { descargarPlantillaImportacion } from '../services/equiposApi';

/**
 * El resultado de una importación (importados/fallidos/errores) se
 * queda visible después de subir — a propósito no se cierra el modal
 * solo al terminar: si hay filas fallidas, la persona necesita leer
 * cuáles y por qué antes de decidir qué hacer.
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
      <p className="text-sm text-slate-600">
        El archivo debe tener las columnas: Placa SENA, Serial, MAC, MAC Cableada, Hostname, Tipo de equipo,
        Responsable, Sede, Subsede, Ambiente y Estado. Cualquier columna adicional (ej. "RAM (GB)", "Procesador")
        se guarda como característica técnica del equipo. Tipo de equipo, Responsable, Sede, Subsede y Ambiente se
        buscan por nombre exacto contra lo que ya existe en el sistema.
      </p>

      <button
        type="button"
        onClick={handleDescargarPlantilla}
        disabled={descargandoPlantilla}
        className="text-sm text-slate-600 underline hover:text-slate-800 disabled:opacity-50"
      >
        {descargandoPlantilla ? 'Generando...' : 'Descargar plantilla de ejemplo'}
      </button>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="archivo-importar" className="block text-sm font-medium text-slate-700">
            Archivo Excel (.xlsx o .xls)
          </label>
          <input
            id="archivo-importar"
            type="file"
            accept=".xlsx,.xls"
            onChange={(event) => setArchivo(event.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm"
          />
        </div>

        {importar.isError && (
          <p className="text-sm text-red-600">
            No se pudo procesar el archivo. Revisa que sea un Excel válido e intenta de nuevo.
          </p>
        )}

        {resultado && (
          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="font-medium text-slate-800">
              {resultado.importados} equipo(s) importado(s) correctamente.
            </p>
            {resultado.fallidos > 0 && (
              <>
                <p className="mt-1 text-red-600">{resultado.fallidos} fila(s) con errores:</p>
                <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                  {resultado.errores.map((error, indice) => (
                    <li key={indice} className="text-slate-600">
                      Fila {error.fila} ({error.campo}): {error.errores.join(' ')}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
            {resultado ? 'Cerrar' : 'Cancelar'}
          </button>
          <button
            type="submit"
            disabled={!archivo || importar.isPending}
            className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {importar.isPending ? 'Importando...' : 'Importar'}
          </button>
        </div>
      </form>
    </div>
  );
}