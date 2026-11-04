import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchUbicaciones, createUbicacion, updateUbicacion, deleteUbicacion } from '../services/ubicacionesApi';

// id entra en la queryKey: cada búsqueda por ID es una consulta distinta.
export function useUbicaciones({ page = 1, subsedeId, id } = {}) {
  return useQuery({
    queryKey: ['ubicaciones-formacion', page, subsedeId ?? null, id ?? null],
    queryFn: () => fetchUbicaciones({ page, subsedeId, id }),
  });
}

/**
 * Para el buscador de ubicaciones (autocompletado), siempre dentro de una
 * subsede. Igual que useBuscarSubsedes: solo se conservan los resultados
 * anteriores si son de la misma subsede.
 */
export function useBuscarUbicaciones(termino, { enabled = true, subsedeId } = {}) {
  return useQuery({
    queryKey: ['ubicaciones-formacion', 'buscar', subsedeId ?? null, termino],
    queryFn: () => fetchUbicaciones({ page: 1, subsedeId, buscar: termino || undefined }),
    enabled: enabled && Boolean(subsedeId),
    placeholderData: (previo, consultaPrevia) =>
      consultaPrevia?.queryKey?.[2] === (subsedeId ?? null) ? previo : undefined,
    staleTime: 30_000,
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