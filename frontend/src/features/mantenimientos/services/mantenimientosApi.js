import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * completado: true trae solo "listo" (pestaña Historial); false trae
 * en_espera + en_mantenimiento (pestaña Activos); omitido no filtra.
 * filtros admite asignado_a (usuario encargado).
 */

export async function fetchMantenimientos({ page = 1, completado, filtros = {} } = {}) {
  const { data } = await httpClient.get(ENDPOINTS.mantenimientos, {
    params: { page, ...(completado !== undefined ? { completado } : {}), ...filtros },
  });
  return data;
}

/**
 * POST /mantenimientos { equipo_id, fecha_programada, descripcion, asignado_a }
 *   -> { data: Mantenimiento, notificaciones: [{ estado, mensaje }] }
 * Se devuelve el mantenimiento con "notificaciones" adjunta, para que la
 * página pueda avisar si el correo al usuario asignado salió o no.
 */
export async function createMantenimiento(payload) {
  const { data } = await httpClient.post(ENDPOINTS.mantenimientos, payload);
  return { ...data.data, notificaciones: data.notificaciones ?? [] };
}

export async function updateMantenimiento(id, payload) {
  const { data } = await httpClient.put(`${ENDPOINTS.mantenimientos}/${id}`, payload);
  return data.data;
}

export async function deleteMantenimiento(id) {
  const { data } = await httpClient.delete(`${ENDPOINTS.mantenimientos}/${id}`);
  return data;
}

/**
 * Mantenimiento masivo — shapes confirmados contra MantenimientoMasivoController:
 * - GET  /mantenimientos/masivo/equipos?ubicacion_formacion_id=
 *        -> { data: [{ id, placa_sena, serial, tipo_equipo, estado, estado_label, tiene_mantenimiento_activo }] }
 * - POST /mantenimientos/masivo  { equipo_ids: [], fecha_programada, descripcion, asignado_a }
 *        -> { mensaje, creados, omitidos: [{ equipo_id, placa_sena, motivo }], notificaciones: [] }
 */

export async function fetchEquiposParaMasivo(ubicacionId) {
  const { data } = await httpClient.get(ENDPOINTS.mantenimientosMasivoEquipos, {
    params: { ubicacion_formacion_id: ubicacionId },
  });
  return data.data;
}

export async function createMantenimientosMasivos(payload) {
  const { data } = await httpClient.post(ENDPOINTS.mantenimientosMasivo, payload);
  return data;
}