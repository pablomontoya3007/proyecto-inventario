/**
 * Convierte un texto en algo seguro para un nombre de archivo:
 * "José Pérez" -> "jose-perez". Lo usan los botones de exportar cuando
 * el Excel es de una persona (cuentadante o usuario asignado).
 */
export function aSlug(texto = '') {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}