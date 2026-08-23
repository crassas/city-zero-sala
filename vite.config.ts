import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import fs from 'node:fs';
import crypto from 'node:crypto';

function verifyProtectedFiles() {
  if (!fs.existsSync('PROTECTED_HASHES.json')) return;
  if (process.env.GRAPH_ENGINEER_OWNER_OVERRIDE === 'AUTHORIZED_BY_OWNER') return;
  const hashes = JSON.parse(fs.readFileSync('PROTECTED_HASHES.json', 'utf8')) as Record<string, string>;
  for (const [file, expected] of Object.entries(hashes)) {
    const actual = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    if (actual !== expected) throw new Error(`PROTECTED_INTEGRITY_FAILED: ${file}`);
  }
}

export default defineConfig(() => {
  verifyProtectedFiles();
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'token-receiver',
        configureServer(server) {
          server.middlewares.use('/api/token', (req, res) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              fs.writeFileSync('RECEIVED_TOKEN.txt', body);
              res.end('OK');
            });
          });
          server.middlewares.use('/api/save-content', (req, res) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                fs.writeFileSync(`DRIVE_CONTENT_${parsed.id}.txt`, parsed.content);
              } catch(e) {}
              res.end('OK');
            });
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
