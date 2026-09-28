import { useQuery } from '@tanstack/react-query';
import { fetchResumenDashboard } from '../services/dashboardApi';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchResumenDashboard,
  });
}
