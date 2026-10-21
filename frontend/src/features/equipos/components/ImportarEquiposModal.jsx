import { useState } from 'react';
import { useImportarEquipos } from '../hooks/useEquipos';
import { descargarPlantillaImportacion } from '../services/equiposApi';
import { ResumenImportacion } from '../../../shared/components/ResumenImportacion';

const ETIQUETAS_RESUMEN = {
  importados: 'Equipos nuevos',
  actualizados: 'Equipos actualizados',
  listaSinCambios: 'Ver equipos que ya estaban registrados con los mismos datos',
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
            Responsable (ahí va el cuentadante), Sede, Subsede, Ambiente y Estado. Cualquier columna adicional (ej.
            "RAM (GB)", "Procesador") se guarda como característica técnica del equipo.
          </p>

          <p className="text-sm text-slate-600">
            Si la placa ya está registrada, el equipo se actualiza con los datos del Excel: solo cambian los campos
            que sean distintos, y una celda vacía deja el valor actual como está (no lo borra). Para un equipo nuevo
            son obligatorios Serial, Tipo de equipo, Sede, Subsede y Ambiente. Tipo de equipo, Sede, Subsede y Ambiente
            deben coincidir con nombres ya registrados; si el cuentadante no existe, se ignora.
          </p>

          <div className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            <p className="font-semibold">⚠ Cuidado: esta es una función peligrosa.</p>
            <p className="mt-1">
              Si subes un Excel viejo o desactualizado, los equipos que ya existen se van a actualizar con esos datos
              antiguos y se perderán los cambios recientes (cuentadante, ubicación, estado, MAC, etc.). Antes de importar, verifica que el archivo
              esté al día.
            </p>
          </div>

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