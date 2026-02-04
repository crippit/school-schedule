import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  define: {
    // Polyfill process.env for the Google GenAI SDK if needed, 
    // though we are switching to import.meta.env for the key.
    'process.env': {} 
  }
});