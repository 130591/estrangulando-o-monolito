import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [react()],

    // "/" para hostname proprio, "/new/" para publicacao por path.
    base: env.VITE_BASE_PATH || '/',

    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
    },

    server: {
      host: true,
      port: 5173,
    },
  }
})
