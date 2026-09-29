import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  fetchLicencias,
  fetchLicenciasSinActualizar,
  createLicencia,
  updateLicencia,
  deleteLicencia,
} from '../services/licenciasApi';

// `filtros` entra en la queryKey a propósito: cada combinación de
// sede/subsede/ubicación/correo/placa/estado/fecha es una consulta
// distinta para TanStack Query.
export function useLicencias(page = 1, filtros = {}) {
  return useQuery({
    queryKey: ['licencias-office', page, filtros],
    queryFn: () => fetchLicencias(page, filtros),
  });
}

// La clave empieza con 'licencias-office' a propósito: crear, editar o
// eliminar una licencia ya invalida ese prefijo, así que esta lista (y el
// contador del menú que la comparte) se refresca sola cuando alguien
// actualiza una licencia, sin tocar esas mutaciones.
export function useLicenciasSinActualizar(page = 1) {
  return useQuery({
    queryKey: ['licencias-office', 'sin-actualizar', page],
    queryFn: () => fetchLicenciasSinActualizar(page),
    // Al cambiar de página se conserva la anterior en pantalla hasta que
    // llega la nueva; sin esto el panel parpadea y desaparece un instante.
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useCreateLicencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLicencia,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['licencias-office'] }),
  });
}

export function useUpdateLicencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateLicencia(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['licencias-office'] }),
  });
}

export function useDeleteLicencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLicencia,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['licencias-office'] }),
  });
}