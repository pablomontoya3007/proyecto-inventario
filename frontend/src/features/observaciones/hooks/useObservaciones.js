import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchObservaciones, createObservacion } from '../services/observacionesApi';

export function useObservaciones({ page = 1, filtros = {} } = {}) {
  return useQuery({
    queryKey: ['observaciones', page, filtros],
    queryFn: () => fetchObservaciones({ page, filtros }),
  });
}

export function useCreateObservacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createObservacion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['observaciones'] }),
  });
}
