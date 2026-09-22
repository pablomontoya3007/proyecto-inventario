import { useQuery, useMutation } from '@tanstack/react-query';
import {
  fetchReporteEquipos,
  descargarReporteEquiposExcel,
  descargarReporteEquiposPdf,
  fetchReporteLicencias,
  descargarReporteLicenciasExcel,
  descargarReporteLicenciasPdf,
  fetchReporteResponsables,
  descargarReporteResponsablesExcel,
  descargarReporteResponsablesPdf,
} from '../services/reportesApi';

// --- Equipos ---

// `filtros` entra en la queryKey a propósito: así TanStack Query trata
// cada combinación de sede/subsede/ubicación como una consulta distinta
// y vuelve a pedir los datos solo cuando cambia el filtro, sin invalidar
// la caché a mano.
export function useReporteEquipos(filtros) {
  return useQuery({
    queryKey: ['reportes', 'equipos', filtros],
    queryFn: () => fetchReporteEquipos(filtros),
  });
}

export function useDescargarReporteEquiposExcel() {
  return useMutation({ mutationFn: descargarReporteEquiposExcel });
}

export function useDescargarReporteEquiposPdf() {
  return useMutation({ mutationFn: descargarReporteEquiposPdf });
}

// --- Licencias ---

export function useReporteLicencias(filtros) {
  return useQuery({
    queryKey: ['reportes', 'licencias', filtros],
    queryFn: () => fetchReporteLicencias(filtros),
  });
}

export function useDescargarReporteLicenciasExcel() {
  return useMutation({ mutationFn: descargarReporteLicenciasExcel });
}

export function useDescargarReporteLicenciasPdf() {
  return useMutation({ mutationFn: descargarReporteLicenciasPdf });
}

// --- Responsables ---

export function useReporteResponsables(filtros) {
  return useQuery({
    queryKey: ['reportes', 'responsables', filtros],
    queryFn: () => fetchReporteResponsables(filtros),
  });
}

export function useDescargarReporteResponsablesExcel() {
  return useMutation({ mutationFn: descargarReporteResponsablesExcel });
}

export function useDescargarReporteResponsablesPdf() {
  return useMutation({ mutationFn: descargarReporteResponsablesPdf });
}