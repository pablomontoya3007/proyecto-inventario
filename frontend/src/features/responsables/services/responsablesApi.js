import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * Shapes confirmados contra ResponsableController.php / Resource:
 * - GET    /responsables?nombre=&page=&sede_id=&subsede_id=&ubicacion_formacion_id= -> { data: [...], links, meta }
 * - POST   /responsables      -> { data: ResponsableResource }
 * - PUT    /responsables/{id} -> { data: ResponsableResource }
 * - DELETE /responsables/{id} -> { mensaje: '...' } — siempre permitido:
 *          equipo.responsable_id usa nullOnDelete, así que borrar un
 *          responsable solo desasigna sus equipos, no lo bloquea.
 */

export async function fetchResponsables({ page = 1, nombre, filtros = {} } = {}) {
  const { data } = await httpClient.get(ENDPOINTS.responsables, {
    params: { page, ...(nombre ? { nombre } : {}), ...filtros },
  });
  return data;
}

export async function createResponsable(payload) {
  const { data } = await httpClient.post(ENDPOINTS.responsables, payload);
  return data.data;
}

export async function updateResponsable(id, payload) {
  const { data } = await httpClient.put(`${ENDPOINTS.responsables}/${id}`, payload);
  return data.data;
}

export async function deleteResponsable(id) {
  const { data } = await httpClient.delete(`${ENDPOINTS.responsables}/${id}`);
  return data;
}