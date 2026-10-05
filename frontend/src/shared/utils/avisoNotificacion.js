/**
 * Convierte la lista "notificaciones" que devuelve el backend
 * ([{ estado: enviado|fallido|omitida, mensaje }]) en un aviso para
 * AvisoBanner. Es "éxito" solo si TODAS salieron; si alguna falló o se
 * omitió, es "advertencia" y se listan todos los mensajes.
 */
export function avisoDeNotificacion(notificaciones, textoBase) {
    const lista = Array.isArray(notificaciones) ? notificaciones : notificaciones ? [notificaciones] : [];

    if (lista.length === 0) {
        return { tipo: 'exito', texto: textoBase };
    }

    const todasEnviadas = lista.every((notificacion) => notificacion.estado === 'enviado');

    return {
        tipo: todasEnviadas ? 'exito' : 'advertencia',
        texto: [textoBase, ...lista.map((notificacion) => notificacion.mensaje)].join(' '),
    };
}