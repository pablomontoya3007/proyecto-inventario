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
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold text-slate-800">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}