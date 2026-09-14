import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * GET /tipos-equipo NO está paginado (index() usa ->get(), no
 * ->paginate()) — a propósito, son pocos valores para un <select>. La
 * respuesta es { data: [...] }, sin "links" ni "meta" como en los
 * módulos anteriores.
 */

export async function fetchTiposEquipo() {
  const { data } = await httpClient.get(ENDPOINTS.tiposEquipo);
  return data.data;
}

export async function createTipoEquipo(payload) {
  const { data } = await httpClient.post(ENDPOINTS.tiposEquipo, payload);
  return data.data;
}

export async function updateTipoEquipo(id, payload) {
  const { data } = await httpClient.put(`${ENDPOINTS.tiposEquipo}/${id}`, payload);
  return data.data;
}

export async function deleteTipoEquipo(id) {
  const { data } = await httpClient.delete(`${ENDPOINTS.tiposEquipo}/${id}`);
  return data;
}
