import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMantenimientos,
  createMantenimiento,
  updateMantenimiento,
  deleteMantenimiento,
} from '../services/mantenimientosApi';

export function useMantenimientos({ page = 1, completado, filtros = {} } = {}) {
  return useQuery({
    queryKey: ['mantenimientos', page, completado ?? null, filtros],
    queryFn: () => fetchMantenimientos({ page, completado, filtros }),
  });
}

export function useCreateMantenimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMantenimiento,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mantenimientos'] }),
  });
}

export function useUpdateMantenimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateMantenimiento(id, payload),
    onSuccess: () => {
      // Invalida ambas pestañas (activos + historial) a la vez, ya que
      // comparten el mismo prefijo de queryKey.
      queryClient.invalidateQueries({ queryKey: ['mantenimientos'] });
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
    },
  });
}

export function useDeleteMantenimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMantenimiento,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mantenimientos'] }),
  });
}
