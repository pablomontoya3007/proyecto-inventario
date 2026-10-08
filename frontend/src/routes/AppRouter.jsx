import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '../layouts/AdminLayout';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { SedesPage } from '../features/sedes/pages/SedesPage';
import { SubsedesPage } from '../features/subsedes/pages/SubsedesPage';
import { UbicacionesPage } from '../features/ubicaciones/pages/UbicacionesPage';
import { TiposEquipoPage } from '../features/tipos-equipo/pages/TiposEquipoPage';
import { ResponsablesPage } from '../features/responsables/pages/ResponsablesPage';
import { EquiposPage } from '../features/equipos/pages/EquiposPage';
import { MantenimientosPage } from '../features/mantenimientos/pages/MantenimientosPage';
import { TrasladosPage } from '../features/traslados/pages/TrasladosPage';
import { LicenciasPage } from '../features/licencias/pages/LicenciasPage';
import { ObservacionesPage } from '../features/observaciones/pages/ObservacionesPage';
import { NovedadesPage } from '../features/novedades/pages/NovedadesPage';
import { ReportesPage } from '../features/reportes/pages/ReportesPage';
import { RespaldosPage } from '../features/respaldos/pages/RespaldosPage';
import { AuditoriaPage } from '../features/auditoria/pages/AuditoriaPage';
import { UsuariosPage } from '../features/usuarios/pages/UsuariosPage';
import { CorreosPage } from '../features/correos/pages/CorreosPage';
import { ErrorBoundary } from '../shared/components/ErrorBoundary';

/**
 * Instancia única a nivel de módulo. El MutationCache invalida el
 * resumen (['dashboard']) después de CUALQUIER guardado exitoso en el
 * sistema: así los contadores del Inicio y de cada módulo siempre
 * reflejan el último cambio, sin tener que tocar los hooks de cada
 * módulo. Solo se vuelve a pedir si hay una pantalla mostrándolo.
 */
const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  }),
});

export function AppRouter() {
  return (
    <ErrorBoundary>
      {/* basename viene del "base" de vite.config.js: '/' en desarrollo y
          '/proyecto-inventario-front/' en el build desplegado en Apache. */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/sedes" element={<SedesPage />} />
                  <Route path="/subsedes" element={<SubsedesPage />} />
                  <Route path="/ubicaciones-formacion" element={<UbicacionesPage />} />
                  <Route path="/tipos-equipo" element={<TiposEquipoPage />} />
                  <Route path="/responsables" element={<ResponsablesPage />} />
                  <Route path="/equipos" element={<EquiposPage />} />
                  <Route path="/mantenimientos" element={<MantenimientosPage />} />
                  <Route path="/traslados" element={<TrasladosPage />} />
                  <Route path="/licencias-office" element={<LicenciasPage />} />
                  <Route path="/observaciones" element={<ObservacionesPage />} />
                  <Route path="/novedades" element={<NovedadesPage />} />
                  <Route path="/reportes" element={<ReportesPage />} />
                  <Route path="/respaldos" element={<RespaldosPage />} />
                  <Route path="/auditoria" element={<AuditoriaPage />} />
                  <Route path="/usuarios" element={<UsuariosPage />} />
                  <Route path="/correos" element={<CorreosPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}