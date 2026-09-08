import axios from 'axios';

// Clave única para guardar el token en localStorage. Definida en un solo
// lugar para no repetir el string 'spy_token' en varios archivos.
export const TOKEN_KEY = 'spy_token';

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api',
  headers: {
    Accept: 'application/json',
  },
});

// Adjunta el Bearer token a toda petición saliente, si existe.
// Los componentes y hooks nunca tocan localStorage directamente para esto;
// solo httpClient sabe cómo se autentica una petición (responsabilidad única).
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejo centralizado de errores de sesión. No decide qué hacer en la UI
// (eso es responsabilidad de ProtectedRoute/AuthContext); solo limpia el
// token inválido para que el resto de la app detecte que ya no hay sesión.
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

export default httpClient;
