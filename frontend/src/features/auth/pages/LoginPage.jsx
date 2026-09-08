import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
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
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow">
        <h1 className="text-xl font-semibold text-slate-800">SPY — Inventario SENA</h1>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Correo
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-slate-800 py-2 font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
