import { Component } from 'react';

/**
 * Los Error Boundaries de React tienen que ser componentes de clase —
 * no existe un equivalente en hooks todavía, ni siquiera con React
 * Compiler. Es la única excepción a "todo en funciones" en este
 * proyecto, y es así en cualquier proyecto de React.
 *
 * Sin esto, un error de render en cualquier componente (como el que
 * tuvimos en SedesPage con deletingSede.id sin encadenamiento opcional)
 * tira toda la app a una pantalla en blanco — sin mensaje, sin forma de
 * recuperarse salvo adivinar que hay que refrescar.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Error atrapado por ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface p-6 text-center">
          <h1 className="text-lg font-semibold text-ink">Algo salió mal</h1>
          <p className="max-w-md text-sm text-slate-600">
            Ocurrió un error inesperado en esta pantalla. Intenta recargar la página; si el problema
            sigue, avísale al equipo de desarrollo.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark"
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}