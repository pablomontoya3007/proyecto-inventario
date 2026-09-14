import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * Shapes confirmados contra ObservacionController.php / Resource:
 * - GET  /observaciones?equipo_id=&page= -> { data: [...], links, meta }
 *        index() siempre trae equipo Y usuario (->with(['equipo','usuario'])),
 *        haya o no filtro por equipo_id.
 * - POST /observaciones -> { data: ObservacionResource } (201)
 *        user_id nunca se manda desde aquí — el backend siempre usa el
 *        usuario autenticado del token, sin importar qué se envíe.
 *
 * Sin update ni delete: routes/api.php solo registra index/store/show
 * para este recurso — las observaciones son inmutables. No hay
 * updateObservacion/deleteObservacion aquí porque no existen, no porque
 * falten.
 */

export async function fetchObservaciones({ page = 1, equipoId } = {}) {
  const { data } = await httpClient.get(ENDPOINTS.observaciones, {
    params: { page, ...(equipoId ? { equipo_id: equipoId } : {}) },
  });
  return data;
}

export async function createObservacion(payload) {
  const { data } = await httpClient.post(ENDPOINTS.observaciones, payload);
  return data.data;
}
