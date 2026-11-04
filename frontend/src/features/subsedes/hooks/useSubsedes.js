import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchSubsedes, createSubsede, updateSubsede, deleteSubsede } from '../services/subsedesApi';

// id entra en la queryKey: cada búsqueda por ID es una consulta distinta.
export function useSubsedes({ page = 1, sedeId, id } = {}) {
  return useQuery({
    queryKey: ['subsedes', page, sedeId ?? null, id ?? null],
    queryFn: () => fetchSubsedes({ page, sedeId, id }),
  });
}

/**
 * Para el buscador de subsedes (autocompletado), siempre dentro de una
 * sede. Solo conserva los resultados anteriores si pertenecen a la MISMA
 * sede: si cambió la sede, mostrar subsedes de la anterior sería engañoso.
 */
export function useBuscarSubsedes(termino, { enabled = true, sedeId } = {}) {
  return useQuery({
    queryKey: ['subsedes', 'buscar', sedeId ?? null, termino],
    queryFn: () => fetchSubsedes({ page: 1, sedeId, buscar: termino || undefined }),
    enabled: enabled && Boolean(sedeId),
    placeholderData: (previo, consultaPrevia) =>
      consultaPrevia?.queryKey?.[2] === (sedeId ?? null) ? previo : undefined,
    staleTime: 30_000,
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