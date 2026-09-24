import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { descargarBlob } from '../../../shared/utils/descargarArchivo';

/**
 * Shapes confirmados contra EquipoController.php / EquipoResource.php:
 * - GET    /equipos?...filtros&page= -> { data: [EquipoResource...], links, meta }
 *          index() trae tipoEquipo, responsable y la cadena completa de
 *          ubicación (ubicacionFormacion.subsede.sede) — NO trae licencia
 *          ni observaciones (eso lo hace show(), para la hoja de vida
 *          completa).
 * - POST   /equipos      -> { data: EquipoResource }
 * - PUT    /equipos/{id} -> { data: EquipoResource }
 * - DELETE /equipos/{id} -> { mensaje: '...' } — siempre permitido, pero
 *          en cascada: borra también la licencia y TODAS las
 *          observaciones del equipo.
 * - POST   /equipos/importar (multipart/form-data, campo "archivo") ->
 *          { importados: number, fallidos: number, errores: [{fila, campo, errores}] }
 * - GET    /equipos/plantilla-importacion -> descarga un .xlsx
 *
 * Filtros soportados por index(): placa_sena, serial, mac, hostname,
 * estado, tipo_equipo_id, responsable_id, ubicacion_formacion_id,
 * subsede_id, sede_id — todos opcionales y combinables.
 */

export async function fetchEquipos(filtros = {}, page = 1) {
  const { data } = await httpClient.get(ENDPOINTS.equipos, {
    params: { page, ...filtros },
  });
  return data;
}

export async function createEquipo(payload) {
  const { data } = await httpClient.post(ENDPOINTS.equipos, payload);
  return data.data;
}

export async function updateEquipo(id, payload) {
  const { data } = await httpClient.put(`${ENDPOINTS.equipos}/${id}`, payload);
  return data.data;
}

export async function deleteEquipo(id) {
  const { data } = await httpClient.delete(`${ENDPOINTS.equipos}/${id}`);
  return data;
}

// GET /equipos/{id} -> { data: EquipoResource } — el mismo show() que ya
// traía tipo/responsable/ubicación/licencia/observaciones, ahora también
// con mantenimientos. Es la fuente de datos de la hoja de vida.
export async function fetchEquipo(id) {
  const { data } = await httpClient.get(`${ENDPOINTS.equipos}/${id}`);
  return data.data;
}

export function descargarHojaDeVidaPdf(id, placaSena) {
  return descargarBlob(httpClient, `${ENDPOINTS.equipos}/${id}/hoja-de-vida/pdf`, `hoja-de-vida-${placaSena}.pdf`);
}

// axios detecta el FormData solo y pone el Content-Type multipart con
// el boundary correcto — no hay que fijarlo a mano.
export async function importarEquipos(archivo) {
  const formData = new FormData();
  formData.append('archivo', archivo);

  const { data } = await httpClient.post(`${ENDPOINTS.equipos}/importar`, formData);
  return data;
}

export function descargarPlantillaImportacion() {
  return descargarBlob(
    httpClient,
    `${ENDPOINTS.equipos}/plantilla-importacion`,
    'plantilla-importar-equipos.xlsx'
  );
}
