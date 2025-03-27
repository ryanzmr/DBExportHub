import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Use true to enable all interfaces but the server will display them nicely
    host: true,
    port: 3000,
    strictPort: true,
    cors: false,
    hmr: {
      overlay: false,
    },
  },
});