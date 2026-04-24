import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve(__dirname, '../../../apps/sample-app/frontend/node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../../apps/sample-app/frontend/node_modules/react-dom'),
      'react/jsx-dev-runtime': path.resolve(__dirname, '../../../apps/sample-app/frontend/node_modules/react/jsx-dev-runtime'),
      'react/jsx-runtime': path.resolve(__dirname, '../../../apps/sample-app/frontend/node_modules/react/jsx-runtime'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setup.ts'],
  },
})
