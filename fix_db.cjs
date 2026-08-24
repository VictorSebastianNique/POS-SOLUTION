const fs = require('fs');
const code = fs.readFileSync('server/db.cjs', 'utf8');
const newCode = code.replace(
    /const dbPath = path\.resolve\(ROOT_DIR, \db_\$\{collectionName\}\.json\\);/g,
    if (!fs.existsSync(ROOT_DIR)) fs.mkdirSync(ROOT_DIR, { recursive: true });\n    const dbPath = path.resolve(ROOT_DIR, \\\db_\\\.json\\\);
);
fs.writeFileSync('server/db.cjs', newCode, 'utf8');
console.log('Done');
