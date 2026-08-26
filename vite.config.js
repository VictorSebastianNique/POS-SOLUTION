import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'

const apiPlugin = () => ({
  name: 'api-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // --- GET ROUTES ---
      if (req.url === '/api/store/global' && req.method === 'GET') {
        const dbPath = path.resolve(process.cwd(), 'db_global.json');
        if (fs.existsSync(dbPath)) {
          res.setHeader('Content-Type', 'application/json');
          res.end(fs.readFileSync(dbPath, 'utf-8'));
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'db_global.json not found' }));
        }
        return;
      }

      if (req.url.startsWith('/api/store/local/') && req.method === 'GET') {
        const urlWithoutQuery = req.url.split('?')[0];
        const locId = urlWithoutQuery.split('/api/store/local/')[1];
        const dbPath = path.resolve(process.cwd(), `db_local_${locId}.json`);
        if (fs.existsSync(dbPath)) {
          res.setHeader('Content-Type', 'application/json');
          res.end(fs.readFileSync(dbPath, 'utf-8'));
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: `db_local_${locId}.json not found` }));
        }
        return;
      }

      // --- POST ROUTES ---
      // GLOBAL
      if (req.url.startsWith('/api/store/global/') && req.method === 'POST') {
        const key = req.url.split('/api/store/global/')[1];
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
          try {
            const dbPath = path.resolve(process.cwd(), 'db_global.json');
            const data = JSON.parse(body);
            let db = {};
            if (fs.existsSync(dbPath)) db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
            db[key] = data;
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      // LOCAL
      if (req.url.match(/^\/api\/store\/local\/([^\/]+)\/(.+)$/) && req.method === 'POST') {
        const matches = req.url.match(/^\/api\/store\/local\/([^\/]+)\/(.+)$/);
        const locId = matches[1];
        const key = matches[2];
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
          try {
            const dbPath = path.resolve(process.cwd(), `db_local_${locId}.json`);
            const data = JSON.parse(body);
            let db = {};
            if (fs.existsSync(dbPath)) db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
            db[key] = data;
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }
      if (req.url === '/api/auth/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
          try {
            const { username, password, locId } = JSON.parse(body);
            const globalPath = path.resolve(process.cwd(), 'db_global.json');
            let globalDb = {};
            if (fs.existsSync(globalPath)) globalDb = JSON.parse(fs.readFileSync(globalPath, 'utf-8'));
            const globalUsers = globalDb.users || [];
            
            const localPath = path.resolve(process.cwd(), `db_local_${locId}.json`);
            let localDb = {};
            if (fs.existsSync(localPath)) localDb = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
            const localUsers = localDb.users || [];
            
            const users = [...globalUsers, ...localUsers];
            const user = users.find(u => u.username === username && u.password === password);
            
            res.setHeader('Content-Type', 'application/json');
            if (user && user.active && (user.role === 'superadmin' || user.locationId === locId)) {
              const safeUser = { ...user };
              delete safeUser.password;
              res.end(JSON.stringify({ success: true, token: 'mock-jwt-token-local', user: safeUser }));
            } else {
              res.statusCode = 401;
              res.end(JSON.stringify({ success: false, error: 'Credenciales inválidas en modo local' }));
            }
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }
      if (req.url === '/api/auth/locations' && req.method === 'GET') {
        try {
          const globalPath = path.resolve(process.cwd(), 'db_global.json');
          let globalDb = {};
          if (fs.existsSync(globalPath)) globalDb = JSON.parse(fs.readFileSync(globalPath, 'utf-8'));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, locations: globalDb.locations || [] }));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
        return;
      }
      
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    apiPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'ADREDI Solutions',
        short_name: 'Adredi',
        description: 'Sistema de Gestión y Punto de Venta',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'icon-192x192.png?v=5',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png?v=5',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: true
  }
})
