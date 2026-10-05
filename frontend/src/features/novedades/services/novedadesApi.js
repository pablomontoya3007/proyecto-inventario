import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * Shapes confirmados contra NovedadController / NovedadResource:
 * - GET   /novedades?page=&placa_sena=&estado=&usuario=&asignado_a=&fecha_desde=&fecha_hasta=&sede_id=&subsede_id=&ubicacion_formacion_id=
 *         -> { data: [Novedad], links, meta }
 * - POST  /novedades { equipo_id, descripcion, asignado_a? }
 *         -> 201 { data: Novedad, notificaciones: [{ estado: enviado|fallido|omitida, mensaje }] }
 * - PATCH /novedades/{id}/resolver { nota_resolucion? } -> { data: Novedad } | 422 { message }
 *
 * Novedad: { id, descripcion, estado, estado_label,
 *            equipo: { id, placa_sena, tipo_equipo, responsable: { id, nombre, correo } | null },
 *            usuario: { id, nombre } | null, asignado: { id, nombre, correo } | null,
 *            nota_resolucion, resuelta_por, resuelta_en, registrada_en }
 */

export async function fetchNovedades({ page = 1, filtros = {} } = {}) {
  const { data } = await httpClient.get(ENDPOINTS.novedades, { params: { page, ...filtros } });
  return data;
}

export async function createNovedad(payload) {
  const { data } = await httpClient.post(ENDPOINTS.novedades, payload);
  return { ...data.data, notificaciones: data.notificaciones ?? [] };
}

export async function resolverNovedad(id, payload) {
  const { data } = await httpClient.patch(`${ENDPOINTS.novedades}/${id}/resolver`, payload);
  return data.data;
}