import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * Shapes confirmados contra SubsedeController.php / SubsedeResource.php:
 * - GET    /subsedes?sede_id=&page= -> { data: [SubsedeResource...], links, meta }
 *          index() siempre trae "sede" (->with('sede')), así que cada fila
 *          ya incluye el objeto sede completo, no solo el id.
 * - POST   /subsedes      -> { data: SubsedeResource }
 * - PUT    /subsedes/{id} -> { data: SubsedeResource }
 * - DELETE /subsedes/{id} -> { mensaje: '...' } (o 403 si tiene ubicaciones activas)
 */

export async function fetchSubsedes({ page = 1, sedeId } = {}) {
  const { data } = await httpClient.get(ENDPOINTS.subsedes, {
    params: { page, ...(sedeId ? { sede_id: sedeId } : {}) },
  });
  return data;
}

export async function createSubsede(payload) {
  const { data } = await httpClient.post(ENDPOINTS.subsedes, payload);
  return data.data;
}

export async function updateSubsede(id, payload) {
  const { data } = await httpClient.put(`${ENDPOINTS.subsedes}/${id}`, payload);
  return data.data;
}

export async function deleteSubsede(id) {
  const { data } = await httpClient.delete(`${ENDPOINTS.subsedes}/${id}`);
  return data;
}