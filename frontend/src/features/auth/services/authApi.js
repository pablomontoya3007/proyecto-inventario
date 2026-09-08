import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * Forma real del objeto que devuelve UserResource (confirmado contra
 * app/Http/Resources/UserResource.php). Documentado con JSDoc en vez de
 * TypeScript, pero el editor igual valida y autocompleta con esto.
 * @typedef {Object} Usuario
 * @property {number} id
 * @property {string} nombre
 * @property {string} correo
 */

/**
 * Confirmado contra AuthController real:
 * - POST /login   -> { usuario: Usuario, token: '...' }
 * - POST /logout  -> { mensaje: '...' }
 * - GET  /me      -> { usuario: Usuario }  (anidado, no el objeto plano)
 */

/** @returns {Promise<{usuario: Usuario, token: string}>} */
export async function login({ email, password }) {
  const { data } = await httpClient.post(ENDPOINTS.auth.login, { email, password });
  return data;
}

export async function logout() {
  await httpClient.post(ENDPOINTS.auth.logout);
}

/** @returns {Promise<Usuario>} */
export async function fetchCurrentUser() {
  const { data } = await httpClient.get(ENDPOINTS.auth.me);
  return data.usuario;
}
