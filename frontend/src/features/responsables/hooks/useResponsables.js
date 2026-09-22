import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchResponsables,
  createResponsable,
  updateResponsable,
  deleteResponsable,
} from '../services/responsablesApi';

export function useResponsables({ page = 1, nombre, filtros = {} } = {}) {
  return useQuery({
    queryKey: ['responsables', page, nombre ?? null, filtros],
    queryFn: () => fetchResponsables({ page, nombre, filtros }),
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