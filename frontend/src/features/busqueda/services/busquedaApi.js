import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * Shape confirmado contra BusquedaController.php:
 * GET /busqueda?q=&sede_id=&subsede_id=&ubicacion_formacion_id=
 *              &tipo_equipo_id=&estado=&sin_licencia=1
 * -> {
 *      equipos:      { total, resultados: [EquipoResource...] } | null,
 *      responsables: { total, resultados: [ResponsableResource + equipos_count] } | null,
 *      licencias:    { total, resultados: [LicenciaOfficeResource + equipo] } | null,
 *      usuarios:     { total, resultados: [UserResource...] } | null,
 *    }
 *
 * - Cada grupo trae como máximo 8 resultados; "total" es el real.
 * - null = el grupo no aplica con esos filtros (usuarios con un filtro
 *   de equipo activo, licencias con "sin licencia"), no "sin resultados".
 * - Sin texto ni filtros, los cuatro llegan en null.
 */
export async function buscarGlobal(parametros) {
  const { data } = await httpClient.get(ENDPOINTS.busqueda, { params: parametros });
  return data;
}