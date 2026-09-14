import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * Shapes confirmados contra UbicacionFormacionController.php / Resource:
 * - GET    /ubicaciones-formacion?subsede_id=&page= -> { data: [...], links, meta }
 *          index() trae subsede Y su sede (->with('subsede.sede')), así
 *          que cada fila llega con la cadena completa sede → subsede.
 * - POST   /ubicaciones-formacion      -> { data: UbicacionFormacionResource }
 * - PUT    /ubicaciones-formacion/{id} -> { data: UbicacionFormacionResource }
 * - DELETE /ubicaciones-formacion/{id} -> { mensaje: '...' } (o 403 si tiene equipos)
 */

export async function fetchUbicaciones({ page = 1, subsedeId } = {}) {
  const { data } = await httpClient.get(ENDPOINTS.ubicacionesFormacion, {
    params: { page, ...(subsedeId ? { subsede_id: subsedeId } : {}) },
  });
  return data;
}

export async function createUbicacion(payload) {
  const { data } = await httpClient.post(ENDPOINTS.ubicacionesFormacion, payload);
  return data.data;
}

export async function updateUbicacion(id, payload) {
  const { data } = await httpClient.put(`${ENDPOINTS.ubicacionesFormacion}/${id}`, payload);
  return data.data;
}

export async function deleteUbicacion(id) {
  const { data } = await httpClient.delete(`${ENDPOINTS.ubicacionesFormacion}/${id}`);
  return data;
}