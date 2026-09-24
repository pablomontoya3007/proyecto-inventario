import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTraslados, createTraslado } from '../services/trasladosApi';

export function useTraslados(page = 1, filtros = {}) {
  return useQuery({
    queryKey: ['traslados', page, filtros],
    queryFn: () => fetchTraslados(page, filtros),
  });
}

export function useCreateTraslado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTraslado,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traslados'] });
      // El equipo cambió de ubicación_formacion_id — sin esto, la
      // sección de Equipos mostraría la ubicación vieja hasta un
      // refresh manual.
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
    },
  });
}
