/**
 * Muestra `texto` con las apariciones de `termino` resaltadas.
 *
 * Ignora mayúsculas y tildes, igual que el buscador del backend: buscar
 * "tamano" resalta "Tamaño". Para eso compara una versión normalizada
 * del texto que tiene EXACTAMENTE la misma longitud que el original
 * (carácter por carácter), así las posiciones encontradas sirven para
 * cortar el texto original sin desfases.
 *
 * No usa expresiones regulares construidas con lo que escribe la
 * persona: un "(" o un "*" en la búsqueda no puede romper nada.
 */
export function TextoResaltado({ texto, termino }) {
  const busqueda = normalizar(termino ?? '');
  if (!texto || !busqueda) return texto ?? null;

  const textoNormalizado = normalizar(texto);
  const partes = [];
  let desde = 0;
  let posicion = textoNormalizado.indexOf(busqueda);

  while (posicion !== -1) {
    if (posicion > desde) partes.push(texto.slice(desde, posicion));
    partes.push(
      <mark key={posicion} className="rounded-sm bg-warning/30 px-0.5 text-ink">
        {texto.slice(posicion, posicion + busqueda.length)}
      </mark>
    );
    desde = posicion + busqueda.length;
    posicion = textoNormalizado.indexOf(busqueda, desde);
  }

  if (desde < texto.length) partes.push(texto.slice(desde));
  return partes;
}

// Una unidad UTF-16 de entrada -> exactamente una de salida. Se usa
// split('') (no Array.from) a propósito: así los índices coinciden con
// los de String.slice incluso si el texto trae emojis.
function normalizar(valor) {
  return valor.split('').map((caracter) => {
    const sinTilde = caracter.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return sinTilde.length === 1 ? sinTilde : caracter;
  }).join('');
}