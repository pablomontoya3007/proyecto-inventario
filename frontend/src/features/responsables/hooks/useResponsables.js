import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  fetchResponsables,
  createResponsable,
  updateResponsable,
  deleteResponsable,
  fetchEquiposParaTraslado,
  trasladarCuentadantes,
} from '../services/responsablesApi';

export function useResponsables({ page = 1, nombre, documento, filtros = {} } = {}) {
  return useQuery({
    queryKey: ['responsables', page, nombre ?? null, documento ?? null, filtros],
    queryFn: () => fetchResponsables({ page, nombre, documento, filtros }),
    placeholderData: keepPreviousData,
  });
}

/**
 * Para BuscadorResponsable (autocompletado). Separado de useResponsables
 * para no cambiar el comportamiento de la página de Responsables:
 * - enabled: solo consulta mientras la lista del buscador está abierta.
 * - keepPreviousData: mientras llega la respuesta del nuevo término, se
 *   siguen mostrando los resultados anteriores en vez de vaciar la lista
 *   (evita el parpadeo en cada letra).
 * - staleTime: repetir un término reciente no vuelve a pedirlo al servidor.
 *
 * La clave empieza por 'responsables', así que las invalidaciones de las
 * mutaciones de abajo también refrescan estas búsquedas.
 */
export function useBuscarResponsables(termino, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['responsables', 'buscar', termino],
    queryFn: () => fetchResponsables({ page: 1, buscar: termino || undefined }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useCreateResponsable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createResponsable,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['responsables'] }),
  });
}

export function useUpdateResponsable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateResponsable(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['responsables'] }),
  });
}

export function useDeleteResponsable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteResponsable,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['responsables'] }),
  });
}

/**
 * Equipos para el selector del traslado de cuentadantes. Solo consulta
 * cuando hay algún criterio (texto, cuentadante actual o "sin
 * cuentadante"): sin criterio traería equipos al azar de todo el
 * inventario. La clave empieza por 'responsables' para que, al
 * trasladar, la invalidación de abajo también la refresque.
 */
export function useEquiposParaTraslado({ buscar, responsableId, sinCuentadante }) {
  const hayCriterio = Boolean(buscar || responsableId || sinCuentadante);

  return useQuery({
    queryKey: ['responsables', 'traslado', 'equipos', buscar ?? '', responsableId ?? null, Boolean(sinCuentadante)],
    queryFn: () => fetchEquiposParaTraslado({ buscar, responsableId, sinCuentadante }),
    enabled: hayCriterio,
    placeholderData: keepPreviousData,
  });
}

/**
 * Además de 'responsables' (cambia el número de equipos de cada uno),
 * invalida 'equipos' (tabla y hojas de vida muestran el cuentadante),
 * 'reportes' y 'dashboard'.
 */
export function useTrasladarCuentadantes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: trasladarCuentadantes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsables'] });
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}