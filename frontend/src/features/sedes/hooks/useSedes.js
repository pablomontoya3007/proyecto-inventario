import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchSedes, createSede, updateSede, deleteSede } from '../services/sedesApi';

export function useSedes(page = 1) {
  return useQuery({
    queryKey: ['sedes', page],
    queryFn: () => fetchSedes(page),
  });
}

/**
 * Para el buscador de sedes (autocompletado). Separado de useSedes para
 * no cambiar el comportamiento de los selects que ya lo usan:
 * - enabled: solo consulta mientras la lista del buscador está abierta.
 * - keepPreviousData: mientras llega la respuesta del nuevo término se
 *   siguen mostrando los resultados anteriores (sin parpadeo).
 * La clave empieza por 'sedes', así que las invalidaciones de las
 * mutaciones también refrescan estas búsquedas.
 */
export function useBuscarSedes(termino, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['sedes', 'buscar', termino],
    queryFn: () => fetchSedes(1, { buscar: termino || undefined }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// Nombre de una sede a partir de su id (para mostrar el valor de un
// buscador cuando solo se conoce el id, p. ej. un filtro de la URL).
export function useSedePorId(id) {
  return useQuery({
    queryKey: ['sedes', 'por-id', String(id ?? '')],
    queryFn: async () => (await fetchSedes(1, { id })).data[0] ?? null,
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  });
}

export function useCreateSede() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSede,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sedes'] }),
  });
}

export function useUpdateSede() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateSede(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sedes'] }),
  });
}

export function useDeleteSede() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSede,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sedes'] }),
  });
}