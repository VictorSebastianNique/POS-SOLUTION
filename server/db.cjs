const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

let db = null;
let mongoClient = null;
const mongoUri = process.env.MONGODB_URI;

// We need the root directory to find fallback local JSONs
const ROOT_DIR = path.resolve(__dirname, '..');

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
      const globalPath = path.resolve(ROOT_DIR, 'db_global.json');
      if (fs.existsSync(globalPath)) {
        const globalData = JSON.parse(fs.readFileSync(globalPath, 'utf-8'));
        await db.collection('store').insertOne({ _id: 'global', ...globalData });
        console.log('Seeded global database successfully.');
      }

      // Seed local files
      const files = fs.readdirSync(ROOT_DIR);
      for (const file of files) {
        if (file.startsWith('db_local_') && file.endsWith('.json')) {
          const locId = file.substring('db_local_'.length, file.length - '.json'.length);
          const localPath = path.resolve(ROOT_DIR, file);
          const localData = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
          await db.collection('store').insertOne({ _id: `local_${locId}`, ...localData });
          console.log(`Seeded local database for "${locId}" successfully.`);
        }
      }
    } else {
      // Merge kardexItems and recipes if global exists
      console.log('MongoDB global exists. Checking for kardexItems and recipe migrations...');
      const globalPath = path.resolve(ROOT_DIR, 'db_global.json');
      if (fs.existsSync(globalPath)) {
        const globalData = JSON.parse(fs.readFileSync(globalPath, 'utf-8'));
        let needsUpdate = false;
        
        // Merge kardexItems
        if (globalData.kardexItems && globalData.kardexItems.length > 0) {
          const currentKardex = globalExists.kardexItems || [];
          if (currentKardex.length === 0) {
            globalExists.kardexItems = globalData.kardexItems;
            needsUpdate = true;
          } else {
            const map = new Map(currentKardex.map(k => [k.id, k]));
            let added = false;
            for (const ki of globalData.kardexItems) {
              const existingKi = map.get(ki.id);
              if (!existingKi) {
                currentKardex.push(ki);
                added = true;
              } else if (existingKi.category !== ki.category) {
                existingKi.category = ki.category;
                added = true;
              }
            }
            if (added) {
              globalExists.kardexItems = currentKardex;
              needsUpdate = true;
            }
          }
        }

        // Merge menu recipes
        if (globalData.menu) {
           const currentMenu = globalExists.menu || [];
           let updatedRecipes = false;
           for (const item of currentMenu) {
             const localItem = globalData.menu.find(m => m.id === item.id);
             if (localItem && localItem.recipe && (!item.recipe || item.recipe.length === 0)) {
               item.recipe = localItem.recipe;
               updatedRecipes = true;
             }
           }
           if (updatedRecipes) {
             globalExists.menu = currentMenu;
             needsUpdate = true;
           }
        }

        if (needsUpdate) {
          const { _id, ...rest } = globalExists;
          await db.collection('store').updateOne({ _id: 'global' }, { $set: rest });
          console.log('Successfully migrated kardexItems and recipes to MongoDB.');
        } else {
          console.log('No migration needed. Database is up to date.');
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
    const dbPath = path.resolve(ROOT_DIR, 'db_global.json');
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
    const dbPath = path.resolve(ROOT_DIR, 'db_global.json');
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
    const dbPath = path.resolve(ROOT_DIR, `db_local_${locId}.json`);
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
    const dbPath = path.resolve(ROOT_DIR, `db_local_${locId}.json`);
    let localDb = {};
    if (fs.existsSync(dbPath)) localDb = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    localDb[key] = value;
    fs.writeFileSync(dbPath, JSON.stringify(localDb, null, 2));
  }
}

async function appendAuditLog(log) {
  if (db) {
    await db.collection('audit_logs').insertOne({
      ...log,
      timestamp: new Date()
    });
  } else {
    const dbPath = path.resolve(ROOT_DIR, 'db_audit.json');
    let localDb = [];
    if (fs.existsSync(dbPath)) localDb = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    localDb.push({
      ...log,
      timestamp: new Date().toISOString()
    });
    fs.writeFileSync(dbPath, JSON.stringify(localDb, null, 2));
  }
}

async function getAuditLogs() {
  if (db) {
    return await db.collection('audit_logs').find({}).sort({ timestamp: -1 }).toArray();
  } else {
    const dbPath = path.resolve(ROOT_DIR, 'db_audit.json');
    if (fs.existsSync(dbPath)) {
      const logs = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      // Sort descending by timestamp
      return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    return [];
  }
}

function getDb() {
  return db;
}

module.exports = {
  initMongo,
  seedMongo,
  getGlobalData,
  writeGlobalData,
  getLocalData,
  writeLocalData,
  appendAuditLog,
  getAuditLogs,
  getDb
};
