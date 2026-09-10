import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSubsedes, createSubsede, updateSubsede, deleteSubsede } from '../services/subsedesApi';

export function useSubsedes({ page = 1, sedeId } = {}) {
  return useQuery({
    queryKey: ['subsedes', page, sedeId ?? null],
    queryFn: () => fetchSubsedes({ page, sedeId }),
  });
}

export function useCreateSubsede() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubsede,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subsedes'] }),
  });
}

export function useUpdateSubsede() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateSubsede(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subsedes'] }),
  });
}

export function useDeleteSubsede() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSubsede,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subsedes'] }),
  });
}