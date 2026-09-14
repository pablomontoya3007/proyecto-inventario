import { useQuery, useMutation } from '@tanstack/react-query';
import {
  fetchReporteEquipos,
  descargarReporteEquiposExcel,
  descargarReporteEquiposPdf,
} from '../services/reportesApi';

export function useReporteEquipos() {
  return useQuery({
    queryKey: ['reportes', 'equipos'],
    queryFn: fetchReporteEquipos,
  });
}

export function useDescargarReporteEquiposExcel() {
  return useMutation({ mutationFn: descargarReporteEquiposExcel });
}

export function useDescargarReporteEquiposPdf() {
  return useMutation({ mutationFn: descargarReporteEquiposPdf });
}
