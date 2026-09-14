import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '../layouts/AdminLayout';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { SedesPage } from '../features/sedes/pages/SedesPage';
import { SubsedesPage } from '../features/subsedes/pages/SubsedesPage';
import { UbicacionesPage } from '../features/ubicaciones/pages/UbicacionesPage';
import { TiposEquipoPage } from '../features/tipos-equipo/pages/TiposEquipoPage';
import { ResponsablesPage } from '../features/responsables/pages/ResponsablesPage';
import { EquiposPage } from '../features/equipos/pages/EquiposPage';
import { LicenciasPage } from '../features/licencias/pages/LicenciasPage';
import { ObservacionesPage } from '../features/observaciones/pages/ObservacionesPage';
import { ReportesPage } from '../features/reportes/pages/ReportesPage';

// Instancia única a nivel de módulo: no hay que recrearla en cada render.
const queryClient = new QueryClient();

export function AppRouter() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                {/* Sin dashboard real todavía: Sedes es la primera pantalla
                    funcional, así que "/" cae directo ahí. */}
                <Route path="/" element={<Navigate to="/sedes" replace />} />
                <Route path="/sedes" element={<SedesPage />} />
                <Route path="/subsedes" element={<SubsedesPage />} />
                <Route path="/ubicaciones-formacion" element={<UbicacionesPage />} />
                <Route path="/tipos-equipo" element={<TiposEquipoPage />} />
                <Route path="/responsables" element={<ResponsablesPage />} />
                <Route path="/equipos" element={<EquiposPage />} />
                <Route path="/licencias-office" element={<LicenciasPage />} />
                <Route path="/observaciones" element={<ObservacionesPage />} />
                <Route path="/reportes" element={<ReportesPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}