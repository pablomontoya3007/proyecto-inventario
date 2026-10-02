import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMantenimientos,
  createMantenimiento,
  updateMantenimiento,
  deleteMantenimiento,
  fetchEquiposParaMasivo,
  createMantenimientosMasivos,
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

/**
 * Lista completa de equipos de una ubicación para el mantenimiento
 * masivo. Solo consulta cuando ya hay una ubicación elegida.
 * La clave empieza por 'mantenimientos': al crear un lote, la
 * invalidación de abajo también refresca qué equipos ya tienen un
 * mantenimiento pendiente.
 */
export function useEquiposParaMasivo(ubicacionId) {
  return useQuery({
    queryKey: ['mantenimientos', 'masivo', 'equipos', ubicacionId],
    queryFn: () => fetchEquiposParaMasivo(ubicacionId),
    enabled: Boolean(ubicacionId),
  });
}

/**
 * Además de la lista de mantenimientos, invalida 'equipos' para que
 * una hoja de vida abierta (o en caché) muestre los nuevos registros,
 * y 'dashboard' para el contador de mantenimientos pendientes.
 */
export function useCreateMantenimientosMasivos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMantenimientosMasivos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mantenimientos'] });
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}