import httpClient from '../../../api/httpClient';

/**
 * GET /auditorias?page=&entidad=&accion=&usuario=&fecha_desde=&fecha_hasta=
 * -> { data: [AuditoriaResource...], links, meta }
 *
 * Solo lectura: no hay create/update/delete — la auditoría se llena
 * sola en el backend cada vez que algo cambia.
 */
export async function fetchAuditorias(page = 1, filtros = {}) {
  const { data } = await httpClient.get('/auditorias', { params: { page, ...filtros } });
  return data;
}
