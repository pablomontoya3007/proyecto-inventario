import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * Shapes confirmados contra SedeController.php y SedeResource.php reales:
 * - GET    /sedes      -> { data: [SedeResource...], links: {...}, meta: {...} }
 *                          (Sede::paginate(15), envoltura estándar de Laravel)
 * - POST   /sedes      -> { data: SedeResource }
 * - PUT    /sedes/{id} -> { data: SedeResource }
 * - DELETE /sedes/{id} -> { mensaje: '...' }  (o 403 si tiene subsedes activas)
 *
 * SedeResource: { id, nombre, subsedes, creado_en, actualizado_en }.
 * "subsedes" solo viene poblado en show() (el controlador hace ->load());
 * en index() llega ausente — por eso en la UI se trata como opcional.
 */

export async function fetchSedes(page = 1) {
  const { data } = await httpClient.get(ENDPOINTS.sedes, { params: { page } });
  return data;
}

export async function createSede(payload) {
  const { data } = await httpClient.post(ENDPOINTS.sedes, payload);
  return data.data;
}

export async function updateSede(id, payload) {
  const { data } = await httpClient.put(`${ENDPOINTS.sedes}/${id}`, payload);
  return data.data;
}

export async function deleteSede(id) {
  const { data } = await httpClient.delete(`${ENDPOINTS.sedes}/${id}`);
  return data;
}