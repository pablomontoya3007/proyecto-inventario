import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchEquipos, createEquipo, updateEquipo, deleteEquipo } from '../services/equiposApi';

export function useEquipos(filtros = {}, page = 1) {
  return useQuery({
    queryKey: ['equipos', filtros, page],
    queryFn: () => fetchEquipos(filtros, page),
  });
}

export function useCreateEquipo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEquipo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipos'] }),
  });
}

export function useUpdateEquipo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateEquipo(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipos'] }),
  });
}

export function useDeleteEquipo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEquipo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipos'] }),
  });
}
