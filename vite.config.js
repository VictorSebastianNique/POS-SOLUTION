import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
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
        const locId = req.url.split('/api/store/local/')[1];
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
      
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: {
    host: true
  }
})
