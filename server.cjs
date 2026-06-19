const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.resolve(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const cleanUrl = req.url.split('?')[0];

  // --- API ROUTING ---
  // GET GLOBAL
  if (cleanUrl === '/api/store/global' && req.method === 'GET') {
    const dbPath = path.resolve(__dirname, 'db_global.json');
    res.setHeader('Content-Type', 'application/json');
    if (fs.existsSync(dbPath)) {
      res.end(fs.readFileSync(dbPath, 'utf-8'));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'db_global.json not found' }));
    }
    return;
  }

  // GET LOCAL
  if (cleanUrl.startsWith('/api/store/local/') && req.method === 'GET') {
    const locId = cleanUrl.split('/api/store/local/')[1];
    const dbPath = path.resolve(__dirname, `db_local_${locId}.json`);
    res.setHeader('Content-Type', 'application/json');
    if (fs.existsSync(dbPath)) {
      res.end(fs.readFileSync(dbPath, 'utf-8'));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: `db_local_${locId}.json not found` }));
    }
    return;
  }

  // POST GLOBAL
  if (cleanUrl.startsWith('/api/store/global/') && req.method === 'POST') {
    const key = cleanUrl.split('/api/store/global/')[1];
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const dbPath = path.resolve(__dirname, 'db_global.json');
        const data = JSON.parse(body);
        let db = {};
        if (fs.existsSync(dbPath)) db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        db[key] = data;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // POST LOCAL
  const localPostRegex = /^\/api\/store\/local\/([^\/]+)\/(.+)$/;
  if (localPostRegex.test(cleanUrl) && req.method === 'POST') {
    const matches = cleanUrl.match(localPostRegex);
    const locId = matches[1];
    const key = matches[2];
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const dbPath = path.resolve(__dirname, `db_local_${locId}.json`);
        const data = JSON.parse(body);
        let db = {};
        if (fs.existsSync(dbPath)) db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        db[key] = data;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // --- STATIC FILE SERVING ---
  const requestUrl = cleanUrl === '/' ? '/index.html' : cleanUrl;
  let filePath = path.join(DIST_DIR, requestUrl);

  // Prevent directory traversal attacks
  if (!filePath.startsWith(DIST_DIR)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA Router Fallback: serve index.html
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.end('Internal Server Error');
      } else {
        res.setHeader('Content-Type', contentType);
        res.end(data);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
