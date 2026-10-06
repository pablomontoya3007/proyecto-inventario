import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * GET /equipos/verificar?placa_sena=&serial=&ignorar_id=
 * -> { placa_sena: Coincidencia | null, serial: Coincidencia | null }
 * Coincidencia: { id, placa_sena, serial, tipo_equipo, ubicacion, eliminado }
 */
export async function verificarEquipo(params) {
    const { data } = await httpClient.get(`${ENDPOINTS.equipos}/verificar`, { params });
    return data;
}