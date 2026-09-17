/**
 * Descarga un archivo binario (Excel, PDF) recibido como blob y dispara
 * la descarga en el navegador. Necesario para cualquier endpoint
 * protegido por Sanctum: un <a href="..."> normal no funciona, porque
 * la navegación del navegador no manda el header Authorization — el
 * archivo se pide por código (con axios, que sí lo manda) y se
 * descarga manualmente. Antes vivía duplicada dentro de reportesApi.js;
 * se extrajo aquí al necesitarla por tercera vez (equiposApi.js).
 */
export async function descargarBlob(httpClient, url, nombreArchivo) {
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
