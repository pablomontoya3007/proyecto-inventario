import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchUbicaciones, createUbicacion, updateUbicacion, deleteUbicacion } from '../services/ubicacionesApi';

// Todos los filtros entran en la queryKey: cada combinación es una
// consulta distinta. keepPreviousData: mientras llega el resultado de una
// búsqueda nueva, la tabla sigue mostrando el anterior (sin parpadeo).
export function useUbicaciones({ page = 1, subsedeId, sedeId, id, nombre } = {}) {
  return useQuery({
    queryKey: ['ubicaciones-formacion', page, subsedeId ?? null, sedeId ?? null, id ?? null, nombre ?? null],
    queryFn: () => fetchUbicaciones({ page, subsedeId, sedeId, id, nombre }),
    placeholderData: keepPreviousData,
  });
}

/**
 * Para el buscador de ubicaciones (autocompletado), siempre dentro de una
 * subsede. Usa el filtro "nombre" que ya tenía el backend. Solo conserva
 * los resultados anteriores si son de la misma subsede.
 */
export function useBuscarUbicaciones(termino, { enabled = true, subsedeId } = {}) {
  return useQuery({
    queryKey: ['ubicaciones-formacion', 'buscar', subsedeId ?? null, termino],
    queryFn: () => fetchUbicaciones({ page: 1, subsedeId, nombre: termino || undefined }),
    enabled: enabled && Boolean(subsedeId),
    placeholderData: (previo, consultaPrevia) =>
      consultaPrevia?.queryKey?.[2] === (subsedeId ?? null) ? previo : undefined,
    staleTime: 30_000,
  });
}

// Nombre de una ubicación a partir de su id (ver useSedePorId).
export function useUbicacionPorId(id) {
  return useQuery({
    queryKey: ['ubicaciones-formacion', 'por-id', String(id ?? '')],
    queryFn: async () => (await fetchUbicaciones({ id })).data[0] ?? null,
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  });
}

export function useCreateUbicacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUbicacion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ubicaciones-formacion'] }),
  });
}

export function useUpdateUbicacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateUbicacion(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ubicaciones-formacion'] }),
  });
}

export function useDeleteUbicacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUbicacion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ubicaciones-formacion'] }),
  });
}