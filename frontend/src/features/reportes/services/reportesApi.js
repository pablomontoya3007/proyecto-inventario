import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { descargarBlob } from '../../../shared/utils/descargarArchivo';

// --- Equipos ---

export async function fetchReporteEquipos() {
  const { data } = await httpClient.get(ENDPOINTS.reportes.equipos);
  return data;
}

export function descargarReporteEquiposExcel() {
  return descargarBlob(httpClient, ENDPOINTS.reportes.equiposExcel, 'equipos-por-categoria.xlsx');
}

export function descargarReporteEquiposPdf() {
  return descargarBlob(httpClient, ENDPOINTS.reportes.equiposPdf, 'equipos-por-categoria.pdf');
}

// --- Licencias ---
// "por vencer" no existe como consulta real: LicenciaOffice no guarda
// fecha de vencimiento, solo fecha_actualizacion (cuándo cambió la
// contraseña). El reporte cubre estado actual + las que ya requieren
// atención (Vencida/Suspendida).

export async function fetchReporteLicencias() {
  const { data } = await httpClient.get(ENDPOINTS.reportes.licencias);
  return data;
}

export function descargarReporteLicenciasExcel() {
  return descargarBlob(httpClient, ENDPOINTS.reportes.licenciasExcel, 'licencias.xlsx');
}

export function descargarReporteLicenciasPdf() {
  return descargarBlob(httpClient, ENDPOINTS.reportes.licenciasPdf, 'licencias.pdf');
}

// --- Responsables ---

export async function fetchReporteResponsables() {
  const { data } = await httpClient.get(ENDPOINTS.reportes.responsables);
  return data;
}

export function descargarReporteResponsablesExcel() {
  return descargarBlob(httpClient, ENDPOINTS.reportes.responsablesExcel, 'responsables.xlsx');
}

export function descargarReporteResponsablesPdf() {
  return descargarBlob(httpClient, ENDPOINTS.reportes.responsablesPdf, 'responsables.pdf');
}