import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * Shapes confirmados contra TrasladoController.php / Resource:
 * - GET  /traslados?page=&sede_id=&subsede_id=&ubicacion_formacion_id= -> { data: [...], links, meta }
 * - POST /traslados       -> { data: TrasladoResource } (201)
 *
 * Sin update ni delete: los traslados son inmutables (mismo patrón que
 * Observaciones).
 *
 * ubicacion_origen_id nunca se manda en el payload de creación — el
 * backend lo captura solo de la ubicación actual del equipo.
 */

export async function fetchTraslados(page = 1, filtros = {}) {
  const { data } = await httpClient.get(ENDPOINTS.traslados, { params: { page, ...filtros } });
  return data;
}

export async function createTraslado(payload) {
  const { data } = await httpClient.post(ENDPOINTS.traslados, payload);
  return data.data;
}
