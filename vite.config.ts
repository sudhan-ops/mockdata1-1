import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Fix: Replace `__dirname` with `process.cwd()` to resolve the project root.
      // `__dirname` is not available in ESM modules, which Vite uses for its config.
      // @ts-ignore - Bypassing a type error where `cwd` is not found on `process`.
      '@': path.resolve(process.cwd(), './'),
    },
  },
})