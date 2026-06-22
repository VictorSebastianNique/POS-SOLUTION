const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const missingItems = [
  { id: "k_tamales", name: "TAMALES", category: "ENTRADAS", active: true },
  { id: "k_humitas", name: "HUMITAS", category: "ENTRADAS", active: true },
  { id: "k_papa_rellena", name: "PAPA RELLENA", category: "ENTRADAS", active: true },
  { id: "k_sangrecita", name: "SANGRECITA", category: "ENTRADAS", active: true },
  { id: "k_aji_gallina", name: "AJI DE GALLINA", category: "ENTRADAS", active: true },
  { id: "k_mollejita", name: "MOLLEJITA", category: "ENTRADAS", active: true },
  { id: "k_patita", name: "PATITA", category: "ENTRADAS", active: true },
  { id: "k_cecina", name: "CECINA", category: "ENTRADAS", active: true },
  { id: "k_adobo", name: "ADOBO", category: "ENTRADAS", active: true },
  { id: "k_sancochado", name: "SANCOCHADO", category: "ENTRADAS", active: true },
  { id: "k_shambar", name: "SHAMBAR", category: "ENTRADAS", active: true },
  { id: "k_caldo_gallina", name: "CALDO DE GALLINA", category: "ENTRADAS", active: true },
  { id: "k_asado", name: "ASADO", category: "GUISOS", active: true },
  { id: "k_cuy", name: "CUY", category: "GUISOS", active: true },
  { id: "k_albondiga", name: "ALBONDIGA", category: "GUISOS", active: true },
  { id: "k_arroz_pato", name: "ARROZ C. PATO", category: "GUISOS", active: true },
  { id: "k_tollo", name: "TOLLO", category: "PESCADOS Y MARISCOS", active: true }
];

async function run() {
  const globalPath = path.resolve(ROOT_DIR, 'db_global.json');
  if (fs.existsSync(globalPath)) {
    const globalDb = JSON.parse(fs.readFileSync(globalPath, 'utf8'));
    
    const existingKardexItems = globalDb.kardexItems || [];
    const newKardexItems = [...existingKardexItems];
    missingItems.forEach(ki => {
      if (!newKardexItems.find(x => x.id === ki.id || x.name === ki.name)) {
        newKardexItems.push(ki);
      }
    });
    globalDb.kardexItems = newKardexItems;

    fs.writeFileSync(globalPath, JSON.stringify(globalDb, null, 2));
    console.log(`Added ${missingItems.length} missing items to db_global.json`);
  } else {
    console.log("db_global.json not found.");
  }
}

run().catch(console.error);
