import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // En el build, la app vive en http://IP/proyecto-inventario-front/,
  // así que los assets deben pedirse con ese prefijo. En desarrollo
  // (npm run dev) se mantiene '/' para que localhost:5173 siga igual.
  // Este valor también queda disponible como import.meta.env.BASE_URL,
  // que usa el router como basename.
  base: command === 'build' ? '/proyecto-inventario-front/' : '/',
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
}))
