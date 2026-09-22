import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTraslados, createTraslado } from '../services/trasladosApi';

export function useTraslados(page = 1, filtros = {}) {
  return useQuery({
    queryKey: ['traslados', page, filtros],
    queryFn: () => fetchTraslados(page, filtros),
  });
}

export function useCreateTraslado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTraslado,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traslados'] });
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
    },
  });
}