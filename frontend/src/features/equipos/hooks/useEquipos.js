import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  fetchEquipos,
  fetchEquipo,
  createEquipo,
  updateEquipo,
  deleteEquipo,
  importarEquipos,
} from '../services/equiposApi';

export function useEquipos(filtros = {}, page = 1) {
  return useQuery({
    queryKey: ['equipos', filtros, page],
    queryFn: () => fetchEquipos(filtros, page),
    // Al cambiar un filtro se conserva el resultado anterior en pantalla
    // hasta que llega el nuevo: así los contadores y la tabla no
    // parpadean con un "Cargando..." en cada tecla.
    placeholderData: keepPreviousData,
  });
}

// Para la hoja de vida: un solo equipo, con todas sus relaciones.
// enabled evita disparar la petición mientras el modal está cerrado.
export function useEquipo(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['equipos', 'detalle', id],
    queryFn: () => fetchEquipo(id),
    enabled: enabled && !!id,
  });
}

export function useCreateEquipo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEquipo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipos'] }),
  });
}

export function useUpdateEquipo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateEquipo(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipos'] }),
  });
}

export function useDeleteEquipo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEquipo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipos'] }),
  });
}

export function useImportarEquipos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importarEquipos,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipos'] }),
  });
}