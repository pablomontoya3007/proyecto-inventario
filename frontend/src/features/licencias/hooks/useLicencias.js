import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLicencias, createLicencia, updateLicencia, deleteLicencia } from '../services/licenciasApi';

// `filtros` entra en la queryKey a propósito: cada combinación de
// sede/subsede/ubicación/correo/placa/estado/fecha es una consulta
// distinta para TanStack Query.
export function useLicencias(page = 1, filtros = {}) {
  return useQuery({
    queryKey: ['licencias-office', page, filtros],
    queryFn: () => fetchLicencias(page, filtros),
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
