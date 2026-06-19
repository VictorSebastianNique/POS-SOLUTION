const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'db.json');
if (!fs.existsSync(dbPath)) {
  console.log('No db.json found');
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

const locations = db.locations || [];
const allUsers = db.users || [];

// Create Global DB
const globalDb = {
  locations: locations,
  users: allUsers.filter(u => u.role === 'superadmin' || u.locationId === 'all'),
  categories: db.categories || [],
  subcategories: db.subcategories || [],
  menu: db.menu || []
};

fs.writeFileSync(path.resolve(__dirname, 'db_global.json'), JSON.stringify(globalDb, null, 2));
console.log('Created db_global.json');

// Create Local DBs
locations.forEach(loc => {
  const locId = loc.id;
  const localDb = {
    users: allUsers.filter(u => u.role !== 'superadmin' && u.locationId !== 'all' && (u.locationId === locId || (!u.locationId && locId === 'sede-principal'))),
    zones: db[`loc_${locId}_zones`] || [],
    orders: db[`loc_${locId}_orders`] || [],
    isBarActive: db[`loc_${locId}_isBarActive`] !== undefined ? db[`loc_${locId}_isBarActive`] : true,
    businessDay: db[`loc_${locId}_businessDay`] || { isOpen: false, startTime: null, totalSales: 0, voids: [], sales: [] },
    pastDays: db[`loc_${locId}_pastDays`] || [],
    activeTables: db[`loc_${locId}_activeTables`] || {},
    companies: db[`loc_${locId}_companies`] || [],
    menuStatus: {}
  };

  // Ensure unassigned local users from old migration go to sede-principal
  if (locId === 'sede-principal') {
     const unassigned = allUsers.filter(u => u.role !== 'superadmin' && u.locationId !== 'all' && !u.locationId);
     unassigned.forEach(u => {
        if (!localDb.users.find(exist => exist.id === u.id)) {
            localDb.users.push(u);
        }
     });
  }

  fs.writeFileSync(path.resolve(__dirname, `db_local_${locId}.json`), JSON.stringify(localDb, null, 2));
  console.log(`Created db_local_${locId}.json`);
});

console.log('Migration complete. You can backup and delete the old db.json if everything works.');
