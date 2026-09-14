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

export function useReporteEquipos() {
  return useQuery({ queryKey: ['reportes', 'equipos'], queryFn: fetchReporteEquipos });
}

export function useDescargarReporteEquiposExcel() {
  return useMutation({ mutationFn: descargarReporteEquiposExcel });
}

export function useDescargarReporteEquiposPdf() {
  return useMutation({ mutationFn: descargarReporteEquiposPdf });
}

// --- Licencias ---

export function useReporteLicencias() {
  return useQuery({ queryKey: ['reportes', 'licencias'], queryFn: fetchReporteLicencias });
}

export function useDescargarReporteLicenciasExcel() {
  return useMutation({ mutationFn: descargarReporteLicenciasExcel });
}

export function useDescargarReporteLicenciasPdf() {
  return useMutation({ mutationFn: descargarReporteLicenciasPdf });
}

// --- Responsables ---

export function useReporteResponsables() {
  return useQuery({ queryKey: ['reportes', 'responsables'], queryFn: fetchReporteResponsables });
}

export function useDescargarReporteResponsablesExcel() {
  return useMutation({ mutationFn: descargarReporteResponsablesExcel });
}

export function useDescargarReporteResponsablesPdf() {
  return useMutation({ mutationFn: descargarReporteResponsablesPdf });
}