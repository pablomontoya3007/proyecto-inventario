import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUbicaciones, createUbicacion, updateUbicacion, deleteUbicacion } from '../services/ubicacionesApi';

export function useUbicaciones({ page = 1, subsedeId } = {}) {
  return useQuery({
    queryKey: ['ubicaciones-formacion', page, subsedeId ?? null],
    queryFn: () => fetchUbicaciones({ page, subsedeId }),
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