import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * Shapes confirmados contra UsuarioController / UserResource:
 * - GET    /usuarios?page=&nombre=&correo=&fecha_desde=&fecha_hasta=
 *          -> { data: [{ id, nombre, correo, creado_en, observaciones_count }], links, meta }
 * - POST   /usuarios      { nombre, correo, password, password_confirmation } -> { data: Usuario }
 * - PUT    /usuarios/{id} { nombre, correo, password?, password_confirmation? } -> { data: Usuario }
 *          (sin password = conserva la actual; con password = cierra las sesiones de ese usuario)
 * - DELETE /usuarios/{id} -> { mensaje } | 403 { message } (propia cuenta o con observaciones)
 */

export async function fetchUsuarios({ page = 1, filtros = {} } = {}) {
  const { data } = await httpClient.get(ENDPOINTS.usuarios, { params: { page, ...filtros } });
  return data;
}

export async function createUsuario(payload) {
  const { data } = await httpClient.post(ENDPOINTS.usuarios, payload);
  return data.data;
}

export async function updateUsuario(id, payload) {
  const { data } = await httpClient.put(`${ENDPOINTS.usuarios}/${id}`, payload);
  return data.data;
}

export async function deleteUsuario(id) {
  const { data } = await httpClient.delete(`${ENDPOINTS.usuarios}/${id}`);
  return data;
}