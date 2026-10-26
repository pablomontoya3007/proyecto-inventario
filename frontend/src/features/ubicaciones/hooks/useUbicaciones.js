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