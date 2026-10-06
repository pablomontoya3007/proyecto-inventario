import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * GET /licencias-office/verificar?equipo_id=&correo=&ignorar_id=
 * -> {
 *      equipo: { id, correo, estado_label } | null,   // licencia que ya tiene ese equipo
 *      correo: [{ licencia_id, placa_sena }]          // otras licencias con ese correo
 *    }
 */
export async function verificarLicencia(params) {
    const { data } = await httpClient.get(`${ENDPOINTS.licenciasOffice}/verificar`, { params });
    return data;
}