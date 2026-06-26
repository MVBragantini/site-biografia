import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://bragantini.com.br',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
