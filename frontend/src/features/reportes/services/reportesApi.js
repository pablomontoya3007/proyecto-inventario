import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { descargarBlob } from '../../../shared/utils/descargarArchivo';

/**
 * filtroUbicacion: { sede_id } | { subsede_id } | { ubicacion_formacion_id } | {}
 * Los tres reportes (y sus descargas) aceptan el mismo filtro — se
 * arma una sola vez en ReportesPage.jsx y se reparte a los nueve.
 */

// --- Equipos ---

export async function fetchReporteEquipos(filtroUbicacion = {}) {
  const { data } = await httpClient.get(ENDPOINTS.reportes.equipos, { params: filtroUbicacion });
  return data;
}

export function descargarReporteEquiposExcel(filtroUbicacion = {}) {
  return descargarBlob(httpClient, ENDPOINTS.reportes.equiposExcel, 'equipos-por-categoria.xlsx', filtroUbicacion);
}

export function descargarReporteEquiposPdf(filtroUbicacion = {}) {
  return descargarBlob(httpClient, ENDPOINTS.reportes.equiposPdf, 'equipos-por-categoria.pdf', filtroUbicacion);
}

// --- Licencias ---
// "por vencer" no existe como consulta real: LicenciaOffice no guarda
// fecha de vencimiento, solo fecha_actualizacion (cuándo cambió la
// contraseña). El reporte cubre estado actual + las que ya requieren
// atención (Vencida/Suspendida).

export async function fetchReporteLicencias(filtroUbicacion = {}) {
  const { data } = await httpClient.get(ENDPOINTS.reportes.licencias, { params: filtroUbicacion });
  return data;
}

export function descargarReporteLicenciasExcel(filtroUbicacion = {}) {
  return descargarBlob(httpClient, ENDPOINTS.reportes.licenciasExcel, 'licencias.xlsx', filtroUbicacion);
}

export function descargarReporteLicenciasPdf(filtroUbicacion = {}) {
  return descargarBlob(httpClient, ENDPOINTS.reportes.licenciasPdf, 'licencias.pdf', filtroUbicacion);
}

// --- Responsables ---

export async function fetchReporteResponsables(filtroUbicacion = {}) {
  const { data } = await httpClient.get(ENDPOINTS.reportes.responsables, { params: filtroUbicacion });
  return data;
}

export function descargarReporteResponsablesExcel(filtroUbicacion = {}) {
  return descargarBlob(httpClient, ENDPOINTS.reportes.responsablesExcel, 'responsables.xlsx', filtroUbicacion);
}

export function descargarReporteResponsablesPdf(filtroUbicacion = {}) {
  return descargarBlob(httpClient, ENDPOINTS.reportes.responsablesPdf, 'responsables.pdf', filtroUbicacion);
}
