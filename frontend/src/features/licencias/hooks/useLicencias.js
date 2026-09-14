import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLicencias, createLicencia, updateLicencia, deleteLicencia } from '../services/licenciasApi';

export function useLicencias(page = 1) {
  return useQuery({
    queryKey: ['licencias-office', page],
    queryFn: () => fetchLicencias(page),
  });
}

export function useCreateLicencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLicencia,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['licencias-office'] }),
  });
}

export function useUpdateLicencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateLicencia(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['licencias-office'] }),
  });
}

export function useDeleteLicencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLicencia,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['licencias-office'] }),
  });
}
