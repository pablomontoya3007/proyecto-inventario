import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * Shapes confirmados contra LicenciaOfficeController.php / Resource:
 * - GET    /licencias-office?page=&sede_id=&subsede_id=&ubicacion_formacion_id=&correo=&placa_sena=&estado=&fecha_desde=&fecha_hasta= -> { data: [...], links, meta }
 * - POST   /licencias-office      -> { data: LicenciaOfficeResource }
 * - PUT    /licencias-office/{id} -> { data: LicenciaOfficeResource }
 * - DELETE /licencias-office/{id} -> { mensaje: '...' } — siempre permitido
 *
 * El backend nunca devuelve la contraseña (ni cifrada): "password" solo
 * se manda AL SERVIDOR (obligatoria al crear, opcional al editar — si se
 * omite, se conserva la actual). Nunca llega en una respuesta GET.
 *
 * equipo_id es único por licencia (un equipo, máximo una licencia) — si
 * ya existe una para ese equipo, el 422 llega bajo el campo equipo_id.
 */

export async function fetchLicencias(page = 1, filtros = {}) {
  const { data } = await httpClient.get(ENDPOINTS.licenciasOffice, { params: { page, ...filtros } });
  return data;
}

export async function createLicencia(payload) {
  const { data } = await httpClient.post(ENDPOINTS.licenciasOffice, payload);
  return data.data;
}

export async function updateLicencia(id, payload) {
  const { data } = await httpClient.put(`${ENDPOINTS.licenciasOffice}/${id}`, payload);
  return data.data;
}

export async function deleteLicencia(id) {
  const { data } = await httpClient.delete(`${ENDPOINTS.licenciasOffice}/${id}`);
  return data;
}

// La única función que puede traer la contraseña en texto plano — se
// llama solo cuando alguien hace clic en "Mostrar" en una fila
// específica, nunca automáticamente al cargar el listado.
export async function fetchLicenciaPassword(id) {
  const { data } = await httpClient.get(`${ENDPOINTS.licenciasOffice}/${id}/password`);
  return data.password;
}
