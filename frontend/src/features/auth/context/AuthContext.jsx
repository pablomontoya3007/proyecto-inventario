import { createContext, useState, useEffect } from 'react';
import { login as loginRequest, logout as logoutRequest, fetchCurrentUser } from '../services/authApi';
import { TOKEN_KEY, setOnUnauthorized } from '../../../api/httpClient';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // true cuando un 401 llegó a mitad de sesión (token vencido/revocado),
  // no cuando el usuario simplemente nunca inició sesión — la diferencia
  // le importa a LoginPage para decidir si mostrar el aviso.
  const [sessionExpired, setSessionExpired] = useState(false);

  // Si cualquier petición en cualquier parte de la app recibe un 401,
  // httpClient llama esto — sin este registro, el estado de React nunca
  // se enteraría de que el token ya no es válido.
  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
      setSessionExpired(true);
    });
  }, []);

  // Al cargar la app, si hay un token guardado de una sesión anterior, se
  // valida contra /me en vez de asumir que sigue siendo válido (pudo
  // expirar o haber sido revocado en el servidor).
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchCurrentUser()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(credentials) {
    const data = await loginRequest(credentials); // { usuario, token } - confirmado
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.usuario);
    setSessionExpired(false);
  }

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      // Se limpia la sesión local incluso si la petición de logout falla
      // (p. ej. el token ya había expirado): el objetivo es que el usuario
      // quede deslogueado en la UI sin importar la causa.
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setSessionExpired(false);
    }
  }

  // No se envuelve este objeto en useMemo a propósito: el proyecto usa
  // React Compiler (elegido al crear la plantilla de Vite), que memoiza
  // automáticamente en tiempo de build.
  const value = { user, isLoading, sessionExpired, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}