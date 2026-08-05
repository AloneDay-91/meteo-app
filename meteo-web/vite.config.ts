import path from "node:path"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  // Points the dev server's /api/* requests at the real Flask backend.
  // Override with VITE_API_PROXY_TARGET (e.g. the VM's address) in a
  // .env.local file once the backend isn't on localhost anymore.
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || "http://localhost:5000"

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
