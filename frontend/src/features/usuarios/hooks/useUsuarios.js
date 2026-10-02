import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../services/usuariosApi';

export function useUsuarios({ page = 1, filtros = {} } = {}) {
  return useQuery({
    queryKey: ['usuarios', page, filtros],
    queryFn: () => fetchUsuarios({ page, filtros }),
  });
}

/**
 * Para el selector de destinatarios de Correos (autocompletado):
 * "buscar" coincide con nombre O correo. Mismo patrón que
 * useBuscarResponsables: solo consulta con la lista abierta, conserva
 * los resultados anteriores mientras llegan los nuevos (sin parpadeo).
 */
export function useBuscarUsuarios(termino, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['usuarios', 'buscar', termino],
    queryFn: () => fetchUsuarios({ page: 1, filtros: termino ? { buscar: termino } : {} }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useCreateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUsuario,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateUsuario(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

export function useDeleteUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUsuario,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}