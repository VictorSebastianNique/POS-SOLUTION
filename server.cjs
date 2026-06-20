const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

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

// MongoDB Setup
let db = null;
let mongoClient = null;
const mongoUri = process.env.MONGODB_URI;

async function initMongo() {
  if (!mongoUri) {
    console.log('No MONGODB_URI environment variable found. Falling back to local JSON database files.');
    return null;
  }
  try {
    console.log('Connecting to MongoDB Atlas...');
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    db = mongoClient.db('cafeteria_pos');
    console.log('Connected successfully to MongoDB Atlas database ("cafeteria_pos").');
    return db;
  } catch (err) {
    console.error('Failed to connect to MongoDB Atlas, falling back to local files:', err);
    return null;
  }
}

async function seedMongo() {
  if (!db) return;
  try {
    const globalExists = await db.collection('store').findOne({ _id: 'global' });
    if (!globalExists) {
      console.log('MongoDB database is empty. Seeding initial data from JSON files...');
      
      // Seed global
      const globalPath = path.resolve(__dirname, 'db_global.json');
      if (fs.existsSync(globalPath)) {
        const globalData = JSON.parse(fs.readFileSync(globalPath, 'utf-8'));
        await db.collection('store').insertOne({ _id: 'global', ...globalData });
        console.log('Seeded global database successfully.');
      }

      // Seed local files
      const files = fs.readdirSync(__dirname);
      for (const file of files) {
        if (file.startsWith('db_local_') && file.endsWith('.json')) {
          const locId = file.substring('db_local_'.length, file.length - '.json'.length);
          const localPath = path.resolve(__dirname, file);
          const localData = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
          await db.collection('store').insertOne({ _id: `local_${locId}`, ...localData });
          console.log(`Seeded local database for "${locId}" successfully.`);
        }
      }
    }
  } catch (err) {
    console.error('Error seeding MongoDB database:', err);
  }
}

async function getGlobalData() {
  if (db) {
    const doc = await db.collection('store').findOne({ _id: 'global' });
    if (doc) {
      const { _id, ...rest } = doc;
      return rest;
    }
    return {};
  } else {
    const dbPath = path.resolve(__dirname, 'db_global.json');
    return fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf-8')) : {};
  }
}

async function writeGlobalData(key, value) {
  if (db) {
    await db.collection('store').updateOne(
      { _id: 'global' },
      { $set: { [key]: value } },
      { upsert: true }
    );
  } else {
    const dbPath = path.resolve(__dirname, 'db_global.json');
    let localDb = {};
    if (fs.existsSync(dbPath)) localDb = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    localDb[key] = value;
    fs.writeFileSync(dbPath, JSON.stringify(localDb, null, 2));
  }
}

async function getLocalData(locId) {
  if (db) {
    const doc = await db.collection('store').findOne({ _id: `local_${locId}` });
    if (doc) {
      const { _id, ...rest } = doc;
      return rest;
    }
    return {};
  } else {
    const dbPath = path.resolve(__dirname, `db_local_${locId}.json`);
    return fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf-8')) : {};
  }
}

async function writeLocalData(locId, key, value) {
  if (db) {
    await db.collection('store').updateOne(
      { _id: `local_${locId}` },
      { $set: { [key]: value } },
      { upsert: true }
    );
  } else {
    const dbPath = path.resolve(__dirname, `db_local_${locId}.json`);
    let localDb = {};
    if (fs.existsSync(dbPath)) localDb = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    localDb[key] = value;
    fs.writeFileSync(dbPath, JSON.stringify(localDb, null, 2));
  }
}

const server = http.createServer(async (req, res) => {
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
    res.setHeader('Content-Type', 'application/json');
    try {
      const data = await getGlobalData();
      res.end(JSON.stringify(data));
    } catch (e) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // GET LOCAL
  if (cleanUrl.startsWith('/api/store/local/') && req.method === 'GET') {
    const locId = decodeURIComponent(cleanUrl.split('/api/store/local/')[1]);
    res.setHeader('Content-Type', 'application/json');
    try {
      const data = await getLocalData(locId);
      res.end(JSON.stringify(data));
    } catch (e) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // POST GLOBAL
  if (cleanUrl.startsWith('/api/store/global/') && req.method === 'POST') {
    const key = cleanUrl.split('/api/store/global/')[1];
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        await writeGlobalData(key, data);
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
    const locId = decodeURIComponent(matches[1]);
    const key = matches[2];
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        await writeLocalData(locId, key, data);
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

// Initialization
initMongo().then(async () => {
  if (db) {
    await seedMongo();
  }
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
