import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchObservaciones, createObservacion } from '../services/observacionesApi';

export function useObservaciones({ page = 1, equipoId } = {}) {
  return useQuery({
    queryKey: ['observaciones', page, equipoId ?? null],
    queryFn: () => fetchObservaciones({ page, equipoId }),
  });
}

export function useCreateObservacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createObservacion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['observaciones'] }),
  });
}
