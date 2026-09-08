import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '../layouts/AdminLayout';
import { LoginPage } from '../features/auth/pages/LoginPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<div>Dashboard — se arma en la Fase 1</div>} />
              {/* Fase 1 agrega aquí: /sedes, /subsedes, /ubicaciones-formacion */}
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
