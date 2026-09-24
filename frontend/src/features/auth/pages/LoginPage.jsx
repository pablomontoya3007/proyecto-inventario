import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, sessionExpired } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate('/', { replace: true });
    } catch (err) {
      const status = err.response?.status;
      setError(
        status === 422 || status === 401
          ? 'Correo o contraseña incorrectos.'
          : 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <form onSubmit={handleSubmit} className="w-full max-w-sm overflow-hidden rounded-lg bg-white shadow">
        {/* Franja superior en Verde SENA: el color institucional se usa
            aquí como acento de marca, no como fondo de sección completa
            (norma 5 del acta). */}
        <div className="h-1.5 bg-sena" />

        <div className="space-y-4 p-8">
          <div>
            <h1 className="text-xl font-bold text-ink">SPY</h1>
            <p className="text-sm text-slate-500">Sistema de Gestión de Inventario de Equipos SENA</p>
          </div>

          {sessionExpired && !error && (
            <p className="rounded bg-amber-50 px-3 py-2 text-sm text-warning">
              Tu sesión expiró. Vuelve a iniciar sesión.
            </p>
          )}

          {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink">
              Correo
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-sena focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded bg-sena py-2 font-medium text-white transition hover:bg-sena-dark disabled:opacity-50"
          >
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </div>
      </form>
    </div>
  );
}
