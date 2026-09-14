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

export async function fetchReporteEquipos() {
  const { data } = await httpClient.get(ENDPOINTS.reportes.equipos);
  return data;
}

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

export function descargarReporteEquiposExcel() {
  return descargarArchivo(ENDPOINTS.reportes.equiposExcel, 'equipos-por-categoria.xlsx');
}

export function descargarReporteEquiposPdf() {
  return descargarArchivo(ENDPOINTS.reportes.equiposPdf, 'equipos-por-categoria.pdf');
}
