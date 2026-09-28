import { useQuery } from '@tanstack/react-query';
import { fetchAuditorias } from '../services/auditoriaApi';

export function useAuditorias(page = 1, filtros = {}) {
  return useQuery({
    queryKey: ['auditorias', page, filtros],
    queryFn: () => fetchAuditorias(page, filtros),
  });
}
