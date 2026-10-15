import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { buscarGlobal } from '../services/busquedaApi';

/**
 * `parametros` ya debe venir limpio (sin claves vacías): así la queryKey
 * es la misma para la misma búsqueda y TanStack Query reutiliza la caché.
 *
 * keepPreviousData: mientras llega la respuesta de lo nuevo que se
 * escribió, se siguen viendo los resultados anteriores en vez de un
 * parpadeo de "Cargando...".
 */
export function useBusquedaGlobal(parametros, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['busqueda', parametros],
    queryFn: () => buscarGlobal(parametros),
    enabled,
    placeholderData: keepPreviousData,
  });
}