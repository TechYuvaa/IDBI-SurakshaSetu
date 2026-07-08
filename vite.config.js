import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vite plugin to mock Vercel serverless functions in local dev
function vercelApiMock() {
  return {
    name: 'vercel-api-mock',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url.startsWith('/api/')) {
          // Parse body for POST requests
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              if (body) {
                req.body = JSON.parse(body);
              }
              
              const endpoint = req.url.split('/api/')[1].split('?')[0];
              const filePath = path.join(__dirname, 'api', `${endpoint}.js`);
              
              if (fs.existsSync(filePath)) {
                // Dynamic import with cache busting for the module
                const handlerPath = `file://${filePath}?t=${Date.now()}`;
                const module = await import(handlerPath);
                
                // Add basic json helper to res
                res.status = (code) => {
                  res.statusCode = code;
                  return res;
                };
                res.json = (data) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                };

                await module.default(req, res);
              } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Endpoint not found' }));
              }
            } catch (err) {
              console.error(err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
          });
        } else {
          next();
        }
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    vercelApiMock()
  ],
  server: {
    port: 8080
  }
})
