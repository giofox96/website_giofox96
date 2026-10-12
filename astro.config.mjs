import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages project site. With a custom domain, set `site` to the domain and remove `base`.
export default defineConfig({
  site: 'https://giofox96.github.io',
  base: '/website_giofox96',
  trailingSlash: 'always',
  integrations: [sitemap()],
  image: {
    responsiveStyles: false,
  },
});
