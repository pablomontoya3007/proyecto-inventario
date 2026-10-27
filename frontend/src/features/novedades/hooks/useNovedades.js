import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
    fetchNovedades,
    createNovedad,
    resolverNovedad,
    fetchEquiposParaNovedadMasiva,
    createNovedadMasiva,
} from '../services/novedadesApi';

export function useNovedades({ page = 1, filtros = {} } = {}) {
    return useQuery({
        queryKey: ['novedades', page, filtros],
        queryFn: () => fetchNovedades({ page, filtros }),
        // Al cambiar un filtro se conserva el resultado anterior en pantalla
        // hasta que llega el nuevo: así los contadores y la tabla no
        // parpadean con un "Cargando..." en cada tecla.
        placeholderData: keepPreviousData,
    });
}

/**
 * Invalida también 'equipos' (el indicador de novedades abiertas de la
 * tabla cambia) y 'correos' (la notificación quedó en el historial).
 */
export function useCreateNovedad() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createNovedad,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['novedades'] });
            queryClient.invalidateQueries({ queryKey: ['equipos'] });
            queryClient.invalidateQueries({ queryKey: ['correos'] });
        },
    });
}

export function useResolverNovedad() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }) => resolverNovedad(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['novedades'] });
            queryClient.invalidateQueries({ queryKey: ['equipos'] });
        },
    });
}

/**
 * Equipos de un ambiente para la novedad masiva. Solo consulta cuando ya
 * hay una ubicación elegida. La clave empieza por 'novedades': al
 * registrar, la invalidación de abajo también refresca cuántas novedades
 * abiertas tiene cada equipo.
 */
export function useEquiposParaNovedadMasiva(ubicacionId) {
    return useQuery({
        queryKey: ['novedades', 'masiva', 'equipos', ubicacionId],
        queryFn: () => fetchEquiposParaNovedadMasiva(ubicacionId),
        enabled: Boolean(ubicacionId),
    });
}

/**
 * Mismas invalidaciones que la novedad individual: listado, indicador de
 * Equipos y historial de Correos.
 */
export function useCreateNovedadMasiva() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createNovedadMasiva,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['novedades'] });
            queryClient.invalidateQueries({ queryKey: ['equipos'] });
            queryClient.invalidateQueries({ queryKey: ['correos'] });
        },
    });
}