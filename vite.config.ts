import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  base: '/', // Add this line explicitly
  plugins: [angular()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});