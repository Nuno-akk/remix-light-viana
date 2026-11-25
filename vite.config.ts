import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig, type Plugin} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

const CONFIG_DIR = path.dirname(fileURLToPath(import.meta.url));

/**
 * Produces a self-contained dist/index.html that runs both:
 *  - directly via file:// when double-clicked from a Windows/Android folder (zero CORS module errors)
 *  - over http(s):// from the Node host server and as an installable PWA
 */
function standaloneFileHtmlPlugin(): Plugin {
  return {
    name: 'standalone-file-html',
    apply: 'build',
    enforce: 'post',
    writeBundle() {
      const distDir = path.resolve(CONFIG_DIR, 'dist');
      const indexPath = path.join(distDir, 'index.html');
      if (!fs.existsSync(indexPath)) return;

      let html = fs.readFileSync(indexPath, 'utf8');

      // 1. Remove the root source file:// redirect helper from the compiled bundle
      html = html.replace(
        /<script\b[^>]*data-dev-file-redirect="true"[^>]*>[\s\S]*?<\/script>\s*/gi,
        '',
      );

      // 2. Replace static <link rel="manifest" ...> with an http(s)-only dynamic loader so file:// avoids CORS warnings
      html = html.replace(
        /<link\b[^>]*rel=["']manifest["'][^>]*>\s*/gi,
        `<script>(function(){if(location.protocol==='http:'||location.protocol==='https:'){var l=document.createElement('link');l.rel='manifest';l.href='./manifest.webmanifest';document.head.appendChild(l);}})();</script>\n    `,
      );

      // 3. Inline built CSS files into <style> tags
      html = html.replace(
        /<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+\.css)["'][^>]*>/gi,
        (fullTag, href: string) => {
          const cleanHref = href.replace(/^\.\//, '').replace(/^\//, '');
          const cssPath = path.resolve(distDir, cleanHref);
          if (!cssPath.startsWith(distDir + path.sep) || !fs.existsSync(cssPath)) {
            return fullTag;
          }
          const cssContent = fs.readFileSync(cssPath, 'utf8').replace(/<\/style/gi, '<\\/style');
          return `<style>\n${cssContent}\n</style>`;
        },
      );

      // 4. Inline built JS entry script and move it right before </body> so #root is mounted before execution
      const inlinedScripts: string[] = [];
      html = html.replace(
        /<script\b[^>]*src=["']([^"']+\.js)["'][^>]*><\/script>/gi,
        (fullTag, src: string) => {
          const cleanSrc = src.replace(/^\.\//, '').replace(/^\//, '');
          const jsPath = path.resolve(distDir, cleanSrc);
          if (!jsPath.startsWith(distDir + path.sep) || !fs.existsSync(jsPath)) {
            return fullTag;
          }
          const jsContent = fs.readFileSync(jsPath, 'utf8').replace(/<\/script/gi, '<\\/script');
          inlinedScripts.push(`<script data-lightviana-bundle="true">\n${jsContent}\n</script>`);
          return '';
        },
      );

      // Insert via slice so $-sequences inside minified JS are never expanded as regex backreferences
      if (inlinedScripts.length > 0) {
        const bodyCloseIdx = html.search(/<\/body>/i);
        const scriptBlock = `${inlinedScripts.join('\n')}\n  `;
        if (bodyCloseIdx !== -1) {
          html =
            html.slice(0, bodyCloseIdx) +
            scriptBlock +
            html.slice(bodyCloseIdx);
        } else {
          html += `\n${scriptBlock}`;
        }
      }

      fs.writeFileSync(indexPath, html, 'utf8');
    },
  };
}

export default defineConfig({
  base: './',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        includeManifestIcons: false,
        includeAssets: [],
        manifest: {
          id: './',
          name: 'LightViana DMX',
          short_name: 'LightViana',
          description:
            'Real-time DMX stage lighting console with Windows host and Android Wi-Fi tablet remote.',
          theme_color: '#090C12',
          background_color: '#090C12',
          display: 'standalone',
          orientation: 'any',
          start_url: './',
          scope: './',
          icons: [
            {
              src: './pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: './pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: './pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
          globPatterns: ['**/*.{html,ico,png,svg,woff,woff2,webmanifest}'],
          globIgnores: ['assets/**', 'sw.js', 'workbox-*.js'],
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/ws/],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      standaloneFileHtmlPlugin(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(CONFIG_DIR, 'dist');
          const srcAssets = path.resolve(CONFIG_DIR, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          format: 'iife' as const,
          name: 'LightVianaApp',
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(CONFIG_DIR, '.'),
      },
    },
    server: {
      allowedHosts: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
