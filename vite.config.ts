import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  define: {
    // Inject the API Key from the Netlify/Build environment
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});