/**
 * Aviso que se puede cerrar, arriba de una página.
 * aviso: { tipo: 'exito' | 'advertencia', texto } o null.
 */
export function AvisoBanner({ aviso, onCerrar }) {
    if (!aviso) return null;

    const estilos = aviso.tipo === 'exito' ? 'bg-sena-soft text-sena-dark' : 'bg-warning/20 text-ink';

    return (
        <div className={`mb-4 flex items-start justify-between gap-4 rounded px-4 py-2 text-sm ${estilos}`}>
            <span>{aviso.texto}</span>
            <button onClick={onCerrar} aria-label="Cerrar aviso" className="text-lg leading-none">
                ×
            </button>
        </div>
    );
}