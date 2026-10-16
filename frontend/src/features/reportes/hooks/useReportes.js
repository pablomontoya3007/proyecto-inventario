import { useQuery, useMutation } from '@tanstack/react-query';
import {
  fetchReporteEquipos,
  descargarReporteEquiposExcel,
  descargarReporteEquiposPdf,
  fetchReporteLicencias,
  descargarReporteLicenciasExcel,
  descargarReporteLicenciasPdf,
  fetchReporteEquiposSinLicencia,
  descargarReporteEquiposSinLicenciaExcel,
  descargarReporteEquiposSinLicenciaPdf,
  fetchReporteResponsables,
  descargarReporteResponsablesExcel,
  descargarReporteResponsablesPdf,
} from '../services/reportesApi';

// Las descargas reciben el filtro en el propio .mutate(filtroUbicacion),
// no cerrado en el hook — así siempre usan el filtro que está activo en
// pantalla en el momento del clic, no uno viejo capturado al montar.

// --- Equipos ---

export function useReporteEquipos(filtroUbicacion = {}) {
  return useQuery({
    queryKey: ['reportes', 'equipos', filtroUbicacion],
    queryFn: () => fetchReporteEquipos(filtroUbicacion),
  });
}

export function useDescargarReporteEquiposExcel() {
  return useMutation({ mutationFn: descargarReporteEquiposExcel });
}

export function useDescargarReporteEquiposPdf() {
  return useMutation({ mutationFn: descargarReporteEquiposPdf });
}

// --- Licencias ---

export function useReporteLicencias(filtroUbicacion = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['reportes', 'licencias', filtroUbicacion],
    queryFn: () => fetchReporteLicencias(filtroUbicacion),
    enabled,
  });
}

export function useDescargarReporteLicenciasExcel() {
  return useMutation({ mutationFn: descargarReporteLicenciasExcel });
}

export function useDescargarReporteLicenciasPdf() {
  return useMutation({ mutationFn: descargarReporteLicenciasPdf });
}

// --- Equipos sin licencia ---
// enabled: la consulta solo corre cuando la sección de Licencias está en
// modo "Equipos sin licencia" — así no se pide un reporte que nadie ve.

export function useReporteEquiposSinLicencia(filtro = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['reportes', 'equipos-sin-licencia', filtro],
    queryFn: () => fetchReporteEquiposSinLicencia(filtro),
    enabled,
  });
}

export function useDescargarReporteEquiposSinLicenciaExcel() {
  return useMutation({ mutationFn: descargarReporteEquiposSinLicenciaExcel });
}

export function useDescargarReporteEquiposSinLicenciaPdf() {
  return useMutation({ mutationFn: descargarReporteEquiposSinLicenciaPdf });
}

// --- Responsables ---

export function useReporteResponsables(filtroUbicacion = {}) {
  return useQuery({
    queryKey: ['reportes', 'responsables', filtroUbicacion],
    queryFn: () => fetchReporteResponsables(filtroUbicacion),
  });
}

export function useDescargarReporteResponsablesExcel() {
  return useMutation({ mutationFn: descargarReporteResponsablesExcel });
}

export function useDescargarReporteResponsablesPdf() {
  return useMutation({ mutationFn: descargarReporteResponsablesPdf });
}