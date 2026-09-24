import httpClient from '../../../api/httpClient';
import { descargarBlob } from '../../../shared/utils/descargarArchivo';

// No agregué "respaldos" a api/endpoints.js porque no verifiqué su
// contenido actual en esta conversación — si ya tienes ese archivo con
// un objeto ENDPOINTS, puedes agregarle `respaldos: '/respaldos'` y
// cambiar las rutas de abajo por `${ENDPOINTS.respaldos}/...`.

export function descargarRespaldo() {
  return descargarBlob(httpClient, '/respaldos/generar', `backup-inventario-${Date.now()}.sql`);
}

export async function restaurarRespaldo(archivo) {
  const formData = new FormData();
  formData.append('archivo', archivo);

  const { data } = await httpClient.post('/respaldos/restaurar', formData);
  return data;
}
