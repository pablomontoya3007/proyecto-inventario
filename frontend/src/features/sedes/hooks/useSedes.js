import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSedes, createSede, updateSede, deleteSede } from '../services/sedesApi';

export function useSedes(page = 1) {
  return useQuery({
    queryKey: ['sedes', page],
    queryFn: () => fetchSedes(page),
  });
}

export function useCreateSede() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSede,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sedes'] }),
  });
}

export function useUpdateSede() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateSede(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sedes'] }),
  });
}

export function useDeleteSede() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSede,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sedes'] }),
  });
}