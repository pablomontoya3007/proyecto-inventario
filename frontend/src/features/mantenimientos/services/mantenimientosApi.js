import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * completado: true trae solo "listo" (pestaña Historial); false trae
 * en_espera + en_mantenimiento (pestaña Activos); omitido no filtra.
 */

export async function fetchMantenimientos({ page = 1, completado, filtros = {} } = {}) {
  const { data } = await httpClient.get(ENDPOINTS.mantenimientos, {
    params: { page, ...(completado !== undefined ? { completado } : {}), ...filtros },
  });
  return data;
}

export async function createMantenimiento(payload) {
  const { data } = await httpClient.post(ENDPOINTS.mantenimientos, payload);
  return data.data;
}

export async function updateMantenimiento(id, payload) {
  const { data } = await httpClient.put(`${ENDPOINTS.mantenimientos}/${id}`, payload);
  return data.data;
}

export async function deleteMantenimiento(id) {
  const { data } = await httpClient.delete(`${ENDPOINTS.mantenimientos}/${id}`);
  return data;
}
