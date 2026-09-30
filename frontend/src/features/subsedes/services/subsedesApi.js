import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * Shapes confirmados contra SubsedeController.php / SubsedeResource.php:
 * - GET    /subsedes?sede_id=&id=&page= -> { data: [SubsedeResource...], links, meta }
 *          index() siempre trae "sede" (->with('sede')), así que cada fila
 *          ya incluye el objeto sede completo, no solo el id.
 *          "id" es coincidencia exacta.
 * - POST   /subsedes      -> { data: SubsedeResource }
 * - PUT    /subsedes/{id} -> { data: SubsedeResource }
 * - DELETE /subsedes/{id} -> { mensaje: '...' } (o 403 si tiene ubicaciones activas)
 *
 * "id" es opcional: los demás lugares que reutilizan esta función
 * (selects en cascada de otros módulos) no lo mandan y siguen igual.
 */

export async function fetchSubsedes({ page = 1, sedeId, id } = {}) {
  const { data } = await httpClient.get(ENDPOINTS.subsedes, {
    params: {
      page,
      ...(sedeId ? { sede_id: sedeId } : {}),
      ...(id ? { id } : {}),
    },
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