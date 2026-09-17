import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * Shapes confirmados contra TrasladoController.php / Resource:
 * - GET  /traslados?page= -> { data: [...], links, meta }
 * - POST /traslados       -> { data: TrasladoResource } (201)
 *
 * Sin update ni delete: routes/api.php solo registra index/store — los
 * traslados son inmutables (mismo patrón que Observaciones). No hay
 * updateTraslado/deleteTraslado aquí porque no existen, no porque falten.
 *
 * ubicacion_origen_id nunca se manda en el payload de creación — el
 * backend lo captura solo de la ubicación actual del equipo.
 */

export async function fetchTraslados(page = 1) {
  const { data } = await httpClient.get(ENDPOINTS.traslados, { params: { page } });
  return data;
}

export async function createTraslado(payload) {
  const { data } = await httpClient.post(ENDPOINTS.traslados, payload);
  return data.data;
}
