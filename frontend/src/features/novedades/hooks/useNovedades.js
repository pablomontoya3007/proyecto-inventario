import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchNovedades, createNovedad, resolverNovedad } from '../services/novedadesApi';

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