import { createContext, useState, useEffect } from 'react';
import { login as loginRequest, logout as logoutRequest, fetchCurrentUser } from '../services/authApi';
import { TOKEN_KEY } from '../../../api/httpClient';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
    const data = await loginRequest(credentials);
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.usuario);
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
    }
  }

  // No se envuelve este objeto en useMemo a propósito: el proyecto usa
  // React Compiler (elegido al crear la plantilla de Vite), que memoiza
  // automáticamente en tiempo de build.
  const value = { user, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
