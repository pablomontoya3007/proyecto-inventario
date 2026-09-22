/**
 * Descarga un archivo binario (Excel, PDF) recibido como blob y dispara
 * la descarga en el navegador. Necesario para cualquier endpoint
 * protegido por Sanctum: un <a href="..."> normal no funciona, porque
 * la navegación del navegador no manda el header Authorization — el
 * archivo se pide por código (con axios, que sí lo manda) y se
 * descarga manualmente. Antes vivía duplicada dentro de reportesApi.js;
 * se extrajo aquí al necesitarla por tercera vez (equiposApi.js).
 *
 * `params` es opcional: los llamadores que no filtran (como la hoja de
 * vida en PDF de un equipo) no necesitan pasar nada y siguen
 * funcionando igual que antes.
 */
export async function descargarBlob(httpClient, url, nombreArchivo, params = {}) {
  const response = await httpClient.get(url, { responseType: 'blob', params });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const enlace = document.createElement('a');
  enlace.href = blobUrl;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.URL.revokeObjectURL(blobUrl);
}