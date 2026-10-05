import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNovedades, createNovedad, resolverNovedad } from '../services/novedadesApi';

export function useNovedades({ page = 1, filtros = {} } = {}) {
    return useQuery({
        queryKey: ['novedades', page, filtros],
        queryFn: () => fetchNovedades({ page, filtros }),
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