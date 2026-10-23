import { useAuth } from '../../auth/hooks/useAuth';
import { BuscadorUsuario } from './BuscadorUsuario';

const CAMPO =
    'rounded border border-slate-300 px-2 py-1 text-sm focus:border-sena focus:outline-none focus:ring-1 focus:ring-sena';

/**
 * Filtro "Asignado a" de Mantenimientos y Novedades: cualquier usuario
 * del sistema (antes solo existía "asignados a mí"). El atajo "Asignados
 * a mí" sigue disponible y simplemente elige al usuario de la sesión.
 *
 * value: { id, nombre } o null. onChange recibe el nuevo valor.
 * textoAtajo: "Asignados a mí" / "Asignadas a mí" según el módulo.
 */
export function FiltroAsignado({
    id,
    value,
    onChange,
    etiqueta = 'Asignado a',
    textoAtajo = 'Asignados a mí',
    inputClassName = CAMPO,
}) {
    const { user } = useAuth();
    const esMio = Boolean(user?.id && value?.id === user.id);

    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-600">
                {etiqueta}
            </label>
            <div className="flex items-center gap-2">
                <BuscadorUsuario
                    id={id}
                    value={value}
                    onChange={onChange}
                    placeholder="Cualquier persona..."
                    className="w-60"
                    inputClassName={inputClassName}
                />
                {user?.id && !esMio && (
                    <button
                        type="button"
                        onClick={() => onChange({ id: user.id, nombre: user.nombre, correo: user.correo })}
                        className="whitespace-nowrap text-xs text-slate-500 underline hover:text-ink"
                    >
                        {textoAtajo}
                    </button>
                )}
            </div>
        </div>
    );
}