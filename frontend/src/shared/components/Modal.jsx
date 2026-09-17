import { useEffect, useId, useRef } from 'react';

/**
 * Contenedor de modal reutilizable: reemplaza el <div className="fixed
 * inset-0..."> que estaba copiado igual en los 8 módulos. Además de
 * unificar el estilo, resuelve tres huecos de accesibilidad que
 * ninguno de esos modales tenía:
 * - Cierra con la tecla Escape.
 * - Atrapa el foco con Tab/Shift+Tab dentro del modal — no se puede
 *   tabular "hacia afuera", al contenido de la página de atrás.
 * - role="dialog" + aria-modal + aria-labelledby (vía useId, sin que
 *   quien lo usa tenga que inventar un id único a mano), para que un
 *   lector de pantalla lo anuncie como diálogo con su título correcto.
 *
 * Al cerrarse, devuelve el foco al elemento que abrió el modal — sin
 * esto, alguien navegando con teclado o lector de pantalla "pierde" su
 * posición en la página.
 */
export function Modal({ title, onClose, children, maxWidth = 'max-w-md' }) {
  const titleId = useId();
  const contenedorRef = useRef(null);
  const elementoQueAbrioRef = useRef(null);

  useEffect(() => {
    elementoQueAbrioRef.current = document.activeElement;

    const primerFocable = contenedorRef.current?.querySelector(
      'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])'
    );
    primerFocable?.focus();

    function manejarTeclado(event) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focales = contenedorRef.current?.querySelectorAll(
        'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focales || focales.length === 0) return;

      const primero = focales[0];
      const ultimo = focales[focales.length - 1];

      if (event.shiftKey && document.activeElement === primero) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener('keydown', manejarTeclado);
    return () => {
      document.removeEventListener('keydown', manejarTeclado);
      elementoQueAbrioRef.current?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div
        ref={contenedorRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg`}
      >
        <h2 id={titleId} className="mb-4 text-lg font-semibold text-slate-800">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}