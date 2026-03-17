import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // When using a custom domain, base should be '/'
  // If serving from github.io/repo-name, change to '/repo-name/'
  base: '/',
})
