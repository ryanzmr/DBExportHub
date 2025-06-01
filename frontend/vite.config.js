import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Enable all network interfaces
    port: parseInt(process.env.VITE_PORT || '3001', 10),
    strictPort: true, // Fail if port is not available
    cors: true, // Enable CORS for development
    hmr: {
      overlay: false,
      port: 24678, // Dedicated port for HMR to avoid conflicts
    },
  },
});