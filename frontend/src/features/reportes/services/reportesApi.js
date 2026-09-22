import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { descargarBlob } from '../../../shared/utils/descargarArchivo';

// --- Equipos ---

export async function fetchReporteEquipos(filtros) {
  const { data } = await httpClient.get(ENDPOINTS.reportes.equipos, { params: filtros });
  return data;
}

export function descargarReporteEquiposExcel(filtros) {
  return descargarBlob(httpClient, ENDPOINTS.reportes.equiposExcel, 'equipos-por-categoria.xlsx', filtros);
}

export function descargarReporteEquiposPdf(filtros) {
  return descargarBlob(httpClient, ENDPOINTS.reportes.equiposPdf, 'equipos-por-categoria.pdf', filtros);
}

// --- Licencias ---
// "por vencer" no existe como consulta real: LicenciaOffice no guarda
// fecha de vencimiento, solo fecha_actualizacion (cuándo cambió la
// contraseña). El reporte cubre estado actual + las que ya requieren
// atención (Vencida/Suspendida).

export async function fetchReporteLicencias(filtros) {
  const { data } = await httpClient.get(ENDPOINTS.reportes.licencias, { params: filtros });
  return data;
}

export function descargarReporteLicenciasExcel(filtros) {
  return descargarBlob(httpClient, ENDPOINTS.reportes.licenciasExcel, 'licencias.xlsx', filtros);
}

export function descargarReporteLicenciasPdf(filtros) {
  return descargarBlob(httpClient, ENDPOINTS.reportes.licenciasPdf, 'licencias.pdf', filtros);
}

// --- Responsables ---

export async function fetchReporteResponsables(filtros) {
  const { data } = await httpClient.get(ENDPOINTS.reportes.responsables, { params: filtros });
  return data;
}

export function descargarReporteResponsablesExcel(filtros) {
  return descargarBlob(httpClient, ENDPOINTS.reportes.responsablesExcel, 'responsables.xlsx', filtros);
}

export function descargarReporteResponsablesPdf(filtros) {
  return descargarBlob(httpClient, ENDPOINTS.reportes.responsablesPdf, 'responsables.pdf', filtros);
}