import httpClient from '../../../api/httpClient';

// GET /dashboard -> { equipos: {...}, licencias: {...},
// mantenimientos_pendientes, responsables_total, estructura: {...},
// ultimas_observaciones: [...], responsables_top: [...] }
export async function fetchResumenDashboard() {
  const { data } = await httpClient.get('/dashboard');
  return data;
}
