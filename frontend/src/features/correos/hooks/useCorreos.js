import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCorreos, enviarCorreo } from '../services/correosApi';

export function useCorreos({ page = 1, filtros = {} } = {}) {
  return useQuery({
    queryKey: ['correos', page, filtros],
    queryFn: () => fetchCorreos({ page, filtros }),
  });
}

/**
 * Invalida el historial tanto si salió como si falló: en ambos casos
 * el backend creó un registro nuevo.
 */
export function useEnviarCorreo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enviarCorreo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['correos'] }),
  });
}