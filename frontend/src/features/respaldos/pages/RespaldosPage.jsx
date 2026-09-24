import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { descargarRespaldo, restaurarRespaldo } from '../services/respaldosApi';

const FRASE_CONFIRMACION = 'RESTAURAR';

// La descarga pide responseType: 'blob' (es un archivo), así que cuando
// el backend responde con un error, axios entrega ese error TAMBIÉN
// como Blob en vez de JSON ya interpretado — hay que leerlo como texto
// y parsearlo a mano para sacar el mensaje real que mandó el Controller.
async function extraerMensajeDeError(error) {
  const datos = error.response?.data;

  if (datos instanceof Blob) {
    try {
      const texto = await datos.text();
      return JSON.parse(texto).message ?? texto;
    } catch {
      // El blob no era JSON legible — se cae al mensaje genérico de abajo.
    }
  }

  return 'No se pudo generar el respaldo. Revisa que mysqldump esté disponible (MYSQLDUMP_PATH en el .env) y que reiniciaste "php artisan serve" después de editarlo.';
}

export function RespaldosPage() {
  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [confirmacionTexto, setConfirmacionTexto] = useState('');

  const restaurar = useMutation({ mutationFn: restaurarRespaldo });

  async function handleDescargarBackup() {
    setDescargando(true);
    setErrorDescarga(null);
    try {
      await descargarRespaldo();
    } catch (error) {
      setErrorDescarga(await extraerMensajeDeError(error));
    } finally {
      setDescargando(false);
    }
  }

  function handleRestaurar() {
    if (!archivo || confirmacionTexto !== FRASE_CONFIRMACION) return;

    restaurar.mutate(archivo, {
      onSuccess: () => {
        setArchivo(null);
        setConfirmacionTexto('');
      },
    });
  }

  const puedeRestaurar = archivo && confirmacionTexto === FRASE_CONFIRMACION;

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold text-ink">Copias de seguridad</h1>

      <section className="rounded border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-lg font-medium text-ink">Generar backup</h2>
        <p className="mb-4 text-sm text-slate-600">
          Descarga un archivo .sql con toda la base de datos tal como está ahora (estructura y datos
          completos). Guárdalo en un lugar seguro fuera del servidor.
        </p>

        {errorDescarga && (
          <p className="mb-3 rounded bg-danger/10 px-3 py-2 text-sm text-danger">{errorDescarga}</p>
        )}

        <button
          onClick={handleDescargarBackup}
          disabled={descargando}
          className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark disabled:opacity-50"
        >
          {descargando ? 'Generando...' : 'Generar y descargar backup'}
        </button>
      </section>

      <section className="rounded border border-danger/30 bg-danger/5 p-4">
        <h2 className="mb-2 text-lg font-medium text-danger">Restaurar backup</h2>
        <p className="mb-1 text-sm text-slate-700">
          <strong>Esto reemplaza TODA la base de datos actual</strong> por el contenido del archivo que subas
          — equipos, licencias, responsables, todo. No se puede deshacer desde esta pantalla.
        </p>
        <p className="mb-4 text-sm text-slate-600">
          El sistema guarda una copia automática de la base actual antes de restaurar (en el servidor), pero
          recuperarla requiere acceso directo a esa máquina. Si el archivo viene de otra instalación con una
          `APP_KEY` distinta, las contraseñas de licencias de Office quedarán ilegibles aunque todo lo demás
          restaure bien.
        </p>

        <div className="mb-3">
          <label htmlFor="archivo-restaurar" className="block text-sm font-medium text-ink">
            Archivo .sql
          </label>
          <input
            id="archivo-restaurar"
            type="file"
            accept=".sql,.txt"
            onChange={(event) => setArchivo(event.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="confirmar-restaurar" className="block text-sm font-medium text-ink">
            Escribe <span className="font-mono font-semibold">{FRASE_CONFIRMACION}</span> para habilitar el
            botón
          </label>
          <input
            id="confirmar-restaurar"
            type="text"
            value={confirmacionTexto}
            onChange={(event) => setConfirmacionTexto(event.target.value)}
            className="mt-1 w-full max-w-xs rounded border border-slate-300 px-2 py-1 text-sm focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger"
          />
        </div>

        {restaurar.isError && (
          <p className="mb-3 rounded bg-danger/10 px-3 py-2 text-sm text-danger">
            {restaurar.error?.response?.data?.mensaje ?? 'No se pudo restaurar el backup. Intenta de nuevo.'}
          </p>
        )}
        {restaurar.isSuccess && (
          <p className="mb-3 rounded bg-sena-soft px-3 py-2 text-sm text-sena-dark">
            Base de datos restaurada correctamente. Es posible que tengas que volver a iniciar sesión.
          </p>
        )}

        <button
          onClick={handleRestaurar}
          disabled={!puedeRestaurar || restaurar.isPending}
          className="rounded bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
        >
          {restaurar.isPending ? 'Restaurando...' : 'Restaurar base de datos'}
        </button>
      </section>
    </div>
  );
}
