import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * Shapes confirmados contra CorreoController / CorreoEnviadoResource:
 * - GET  /correos?page=&asunto=&destinatario=&remitente=&estado=&fecha_desde=&fecha_hasta=
 *        -> { data: [CorreoEnviado], links, meta }
 * - POST /correos { usuario_ids: [], correos: [], asunto, cuerpo }
 *        -> 201 { data: CorreoEnviado }  — revisar data.estado: 'enviado' | 'fallido'
 *        -> 429 si se superan 10 envíos por minuto
 *
 * CorreoEnviado: { id, asunto, cuerpo, destinatarios: string[], total_destinatarios,
 *                  estado, estado_label, error, remitente: { id, nombre } | null, enviado_en }
 */

export async function fetchCorreos({ page = 1, filtros = {} } = {}) {
  const { data } = await httpClient.get(ENDPOINTS.correos, { params: { page, ...filtros } });
  return data;
}

export async function enviarCorreo(payload) {
  const { data } = await httpClient.post(ENDPOINTS.correos, payload);
  return data.data;
}