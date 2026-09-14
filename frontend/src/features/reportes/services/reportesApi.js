import httpClient from '../../../api/httpClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * Los endpoints de exportación (/excel, /pdf) devuelven el archivo
 * binario directo, no JSON — por eso responseType: 'blob'. Y por eso no
 * se abren con un <a href="..."> normal: la navegación del navegador no
 * manda el header Authorization que exige Sanctum, así que un link
 * directo a estas rutas devolvería 401. axios sí lo manda (vía el
 * interceptor de httpClient), así que el archivo se pide por código y
 * la descarga se dispara manualmente en el navegador.
 */

async function descargarArchivo(url, nombreArchivo) {
  const response = await httpClient.get(url, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const enlace = document.createElement('a');
  enlace.href = blobUrl;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.URL.revokeObjectURL(blobUrl);
}

// --- Equipos ---

export async function fetchReporteEquipos() {
  const { data } = await httpClient.get(ENDPOINTS.reportes.equipos);
  return data;
}

export function descargarReporteEquiposExcel() {
  return descargarArchivo(ENDPOINTS.reportes.equiposExcel, 'equipos-por-categoria.xlsx');
}

export function descargarReporteEquiposPdf() {
  return descargarArchivo(ENDPOINTS.reportes.equiposPdf, 'equipos-por-categoria.pdf');
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
  return descargarArchivo(ENDPOINTS.reportes.licenciasExcel, 'licencias.xlsx');
}

export function descargarReporteLicenciasPdf() {
  return descargarArchivo(ENDPOINTS.reportes.licenciasPdf, 'licencias.pdf');
}

// --- Responsables ---

export async function fetchReporteResponsables() {
  const { data } = await httpClient.get(ENDPOINTS.reportes.responsables);
  return data;
}

export function descargarReporteResponsablesExcel() {
  return descargarArchivo(ENDPOINTS.reportes.responsablesExcel, 'responsables.xlsx');
}

export function descargarReporteResponsablesPdf() {
  return descargarArchivo(ENDPOINTS.reportes.responsablesPdf, 'responsables.pdf');
}