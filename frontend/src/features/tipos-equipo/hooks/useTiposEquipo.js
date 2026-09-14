import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTiposEquipo,
  createTipoEquipo,
  updateTipoEquipo,
  deleteTipoEquipo,
} from '../services/tiposEquipoApi';

export function useTiposEquipo() {
  return useQuery({
    queryKey: ['tipos-equipo'],
    queryFn: fetchTiposEquipo,
  });
}

export function useCreateTipoEquipo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTipoEquipo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tipos-equipo'] }),
  });
}

export function useUpdateTipoEquipo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateTipoEquipo(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tipos-equipo'] }),
  });
}

export function useDeleteTipoEquipo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTipoEquipo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tipos-equipo'] }),
  });
}
