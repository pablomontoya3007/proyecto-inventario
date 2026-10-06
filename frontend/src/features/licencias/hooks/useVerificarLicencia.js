import { useQuery } from '@tanstack/react-query';
import { useValorDiferido } from '../../../shared/hooks/useValorDiferido';
import { verificarLicencia } from '../services/verificacionLicenciaApi';

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Verifica en vivo:
 * - si el equipo elegido ya tiene una licencia (bloquea guardar);
 * - si el correo ya está en otras licencias (solo advierte).
 * Dos consultas separadas, igual que en equipos. El correo solo se
 * consulta cuando tiene formato de correo completo.
 */
export function useVerificarLicencia({ equipoId, correo, ignorarId }) {
    const correoActual = correo.trim().toLowerCase();
    const correoDiferido = useValorDiferido(correoActual);
    const correoValido = FORMATO_CORREO.test(correoDiferido);

    const consultaEquipo = useQuery({
        queryKey: ['licencias', 'verificar', 'equipo', equipoId ?? null, ignorarId ?? null],
        queryFn: () => verificarLicencia({ equipo_id: equipoId, ignorar_id: ignorarId || undefined }),
        enabled: Boolean(equipoId),
    });

    const consultaCorreo = useQuery({
        queryKey: ['licencias', 'verificar', 'correo', correoDiferido, ignorarId ?? null],
        queryFn: () => verificarLicencia({ correo: correoDiferido, ignorar_id: ignorarId || undefined }),
        enabled: correoValido,
    });

    const correoAlDia = correoValido && correoActual === correoDiferido;

    return {
        licenciaDelEquipo: equipoId ? (consultaEquipo.data?.equipo ?? null) : null,
        licenciasConCorreo: correoAlDia ? (consultaCorreo.data?.correo ?? []) : [],
        verificandoEquipo: Boolean(equipoId) && consultaEquipo.isFetching,
    };
}