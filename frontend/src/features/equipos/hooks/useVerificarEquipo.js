import { useQuery } from '@tanstack/react-query';
import { useValorDiferido } from '../../../shared/hooks/useValorDiferido';
import { verificarEquipo } from '../services/verificacionEquipoApi';

/**
 * Verifica en vivo si la placa y el serial ya existen. Son DOS consultas
 * separadas a propósito: así, al escribir el serial no desaparece el
 * aviso de la placa (y viceversa).
 *
 * Solo se muestra un resultado cuando corresponde a lo que hay escrito
 * AHORA en el campo (no a lo de hace 400 ms).
 *
 * Las claves empiezan por 'equipos': al crear o eliminar un equipo, las
 * invalidaciones que ya existen también refrescan estas verificaciones.
 */
export function useVerificarEquipo({ placa, serial, ignorarId }) {
    const placaActual = placa.trim();
    const serialActual = serial.trim();
    const placaDiferida = useValorDiferido(placaActual);
    const serialDiferido = useValorDiferido(serialActual);

    const consultaPlaca = useQuery({
        queryKey: ['equipos', 'verificar', 'placa', placaDiferida, ignorarId ?? null],
        queryFn: () => verificarEquipo({ placa_sena: placaDiferida, ignorar_id: ignorarId || undefined }),
        enabled: placaDiferida !== '',
    });

    const consultaSerial = useQuery({
        queryKey: ['equipos', 'verificar', 'serial', serialDiferido, ignorarId ?? null],
        queryFn: () => verificarEquipo({ serial: serialDiferido, ignorar_id: ignorarId || undefined }),
        enabled: serialDiferido !== '',
    });

    const placaAlDia = placaActual !== '' && placaActual === placaDiferida;
    const serialAlDia = serialActual !== '' && serialActual === serialDiferido;

    return {
        duplicadoPlaca: placaAlDia ? (consultaPlaca.data?.placa_sena ?? null) : null,
        duplicadoSerial: serialAlDia ? (consultaSerial.data?.serial ?? null) : null,
        verificandoPlaca: placaActual !== '' && (!placaAlDia || consultaPlaca.isFetching),
        verificandoSerial: serialActual !== '' && (!serialAlDia || consultaSerial.isFetching),
    };
}