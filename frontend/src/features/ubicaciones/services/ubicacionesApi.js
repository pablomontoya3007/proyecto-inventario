import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * Shapes confirmados contra UbicacionFormacionController.php / Resource:
 * - GET    /ubicaciones-formacion?subsede_id=&id=&page= -> { data: [...], links, meta }
 *          index() trae subsede Y su sede (->with('subsede.sede')), así
 *          que cada fila llega con la cadena completa sede → subsede.
 *          "id" es coincidencia exacta.
 * - POST   /ubicaciones-formacion      -> { data: UbicacionFormacionResource }
 * - PUT    /ubicaciones-formacion/{id} -> { data: UbicacionFormacionResource }
 * - DELETE /ubicaciones-formacion/{id} -> { mensaje: '...' } (o 403 si tiene equipos)
 *
 * "id" es opcional: los selects en cascada de otros módulos no lo
 * mandan y siguen funcionando igual.
 */

export async function fetchUbicaciones({ page = 1, subsedeId, id } = {}) {
  const { data } = await httpClient.get(ENDPOINTS.ubicacionesFormacion, {
    params: {
      page,
      ...(subsedeId ? { subsede_id: subsedeId } : {}),
      ...(id ? { id } : {}),
    },
  });
  return data;
}

export async function createUbicacion(payload) {
  const { data } = await httpClient.post(ENDPOINTS.ubicacionesFormacion, payload);
  return data.data;
}

export async function updateUbicacion(id, payload) {
  const { data } = await httpClient.put(`${ENDPOINTS.ubicacionesFormacion}/${id}`, payload);
  return data.data;
}

export async function deleteUbicacion(id) {
  const { data } = await httpClient.delete(`${ENDPOINTS.ubicacionesFormacion}/${id}`);
  return data;
}