import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * Shapes confirmados contra ObservacionController.php / Resource:
 * - GET  /observaciones?page=&placa_sena=&usuario=&sede_id=&subsede_id=&ubicacion_formacion_id= -> { data: [...], links, meta }
 *        index() siempre trae equipo Y usuario (->with(['equipo','usuario'])).
 * - POST /observaciones -> { data: ObservacionResource } (201)
 *        user_id nunca se manda desde aquí — el backend siempre usa el
 *        usuario autenticado del token, sin importar qué se envíe.
 *
 * Sin update ni delete: las observaciones son inmutables.
 */

export async function fetchObservaciones({ page = 1, filtros = {} } = {}) {
  const { data } = await httpClient.get(ENDPOINTS.observaciones, {
    params: { page, ...filtros },
  });
  return data;
}

export async function createObservacion(payload) {
  const { data } = await httpClient.post(ENDPOINTS.observaciones, payload);
  return data.data;
}
