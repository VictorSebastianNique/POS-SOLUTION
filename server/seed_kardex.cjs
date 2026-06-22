const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const kardexItems = [
  { id: "k_cabrito_normal", name: "CABRITO NORMAL", category: "GUISOS", active: true },
  { id: "k_pato_estofado", name: "PATO ESTOFADO", category: "GUISOS", active: true },
  { id: "k_pepian", name: "PEPIAN", category: "GUISOS", active: true },
  { id: "k_corvina_guisada", name: "CORVINA GUISADA", category: "GUISOS", active: true },
  { id: "k_lomo_saltado", name: "LOMO SALTADO", category: "CARNES", active: true },
  { id: "k_filete_pollo", name: "FILETE DE POLLO CARTA", category: "CARNES", active: true },
  { id: "k_milanesa", name: "MILANESA CARTA", category: "CARNES", active: true },
  { id: "k_bisteck", name: "BISTECK CARTA", category: "CARNES", active: true },
  { id: "k_chicharron_pollo", name: "CHICHARRON DE POLLO", category: "FRITURAS", active: true },
  { id: "k_lenguado", name: "LENGUADO", category: "PESCADOS Y MARISCOS", active: true },
  { id: "k_corvina", name: "CORVINA", category: "PESCADOS Y MARISCOS", active: true },
  { id: "k_pulpo_olivo", name: "PULPO AL OLIVO", category: "PESCADOS Y MARISCOS", active: true },
  { id: "k_pulpo_anticuchero", name: "PULPO ANTICUCHERO", category: "PESCADOS Y MARISCOS", active: true },
  { id: "k_pulpo_causas", name: "PULPO(CAUSAS)", category: "PESCADOS Y MARISCOS", active: true },
  { id: "k_camaron", name: "CAMARON", category: "PESCADOS Y MARISCOS", active: true },
  { id: "k_mixtura_mariscos", name: "MIXTURA(MARISCOS)", category: "PESCADOS Y MARISCOS", active: true },
  { id: "k_mixtura_ceviches", name: "MIXTURA(CEVICHES)", category: "PESCADOS Y MARISCOS", active: true },
  { id: "k_langostinos_mariscos", name: "LANGOSTINOS(MARISCOS)", category: "PESCADOS Y MARISCOS", active: true },
  { id: "k_langostino_causa", name: "LANGOSTINO(CAUSA)", category: "PESCADOS Y MARISCOS", active: true }
];

const recipesMapping = {
  "CABRITO C/ TACU TACU": [{ kardexId: "k_cabrito_normal", qty: 1 }],
  "CABRITO C/ARROZ FRIJOL Y YUCA": [{ kardexId: "k_cabrito_normal", qty: 1 }],
  "PRESA DE CABRITO": [{ kardexId: "k_cabrito_normal", qty: 1 }],
  "CABRITO DESHUESADO": [{ kardexId: "k_cabrito_normal", qty: 2 }],
  "CABRITO DESHUESADO C TACU TACU": [{ kardexId: "k_cabrito_normal", qty: 2 }],
  "PIQUEO DOÑA FRESIA": [{ kardexId: "k_cabrito_normal", qty: 2 }, { kardexId: "k_pato_estofado", qty: 2 }],
  "PATO ESTOFADO C/ARROZ Y FRIJOL": [{ kardexId: "k_pato_estofado", qty: 1 }],
  "PATO ESTOFADO DESHUESADO": [{ kardexId: "k_pato_estofado", qty: 2 }],
  "TACU TACU C/ PATO ESTOF. DESHUESADO": [{ kardexId: "k_pato_estofado", qty: 2 }],
  "PATO ESTOFADO CON TACU TACU": [{ kardexId: "k_pato_estofado", qty: 1 }],
  "PEPIAN DE PAVO": [{ kardexId: "k_pepian", qty: 1 }],
  "PRESA DE PAVA": [{ kardexId: "k_pepian", qty: 1 }],
  "SANDWICH DE PAVO": [{ kardexId: "k_pepian", qty: 1 }],
  "CORVINA GUISADA C/E CHOCLO": [{ kardexId: "k_corvina_guisada", qty: 1 }],
  "LOMO SALTADO C/ARROZ": [{ kardexId: "k_lomo_saltado", qty: 1 }],
  "TACU TACU C/ LOMO SALTADO": [{ kardexId: "k_lomo_saltado", qty: 1 }],
  "LOMO SALTADO A LO POBRE": [{ kardexId: "k_lomo_saltado", qty: 1 }],
  "FETUCCINI AL P.C/ LOMO SALTADO": [{ kardexId: "k_lomo_saltado", qty: 1 }],
  "FETUCCINI A LO ALFR.C/ LOMO SALTADO": [{ kardexId: "k_lomo_saltado", qty: 1 }],
  "FETUCCINI A LA H.C/ LOMO SALTADO": [{ kardexId: "k_lomo_saltado", qty: 1 }],
  "RISOTTO A LA H. C/ LOMO SALTADO": [{ kardexId: "k_lomo_saltado", qty: 1 }],
  "RISOTTO PESTO C/LOMO SALTADO": [{ kardexId: "k_lomo_saltado", qty: 1 }],
  "CAUSA DE LOMO FINO SALTADO": [{ kardexId: "k_lomo_saltado", qty: 0.5 }],
  "LOMO SALTADO A NUESTRO ESTILO": [{ kardexId: "k_lomo_saltado", qty: 1 }],
  "SANDWICH DE LOMO FINO SALTADO": [{ kardexId: "k_lomo_saltado", qty: 0.5 }],
  "LOMO SALTADO C/ ARROZ Y FRIJOL": [{ kardexId: "k_lomo_saltado", qty: 1 }],
  "SALTADO MAR Y TIERRA": [{ kardexId: "k_lomo_saltado", qty: 0.5 }, { kardexId: "k_filete_pollo", qty: 0.5 }, { kardexId: "k_langostinos_mariscos", qty: 0.5 }],
  "LOMO EN NUESTRO ESTILO": [{ kardexId: "k_lomo_saltado", qty: 1 }],
  "FILETE DE POLLO A LA PLANCHA": [{ kardexId: "k_filete_pollo", qty: 1 }],
  "FETUCCINI A LO ALFR.C/ FILETE DE POLLO": [{ kardexId: "k_filete_pollo", qty: 1 }],
  "FETUCCINI A LA H.C/ FILETE DE POLLO": [{ kardexId: "k_filete_pollo", qty: 1 }],
  "FETUCCINI AL P.C/ FILETE DE POLLO": [{ kardexId: "k_filete_pollo", qty: 1 }],
  "PIQUEO PERUANISIMO": [{ kardexId: "k_filete_pollo", qty: 2 }],
  "DIETA DE POLLO": [{ kardexId: "k_filete_pollo", qty: 0.5 }],
  "RISOTTO PESTO C/FILETE DE POLLO": [{ kardexId: "k_filete_pollo", qty: 1 }],
  "POLLO SALTADO C/ ARROZ Y PAPAS FRITAS": [{ kardexId: "k_filete_pollo", qty: 1 }],
  "PRESA DE FILETE DE POLLO": [{ kardexId: "k_filete_pollo", qty: 1 }],
  "CAUSA DE POLLO": [{ kardexId: "k_filete_pollo", qty: 1 }],
  "SANDWICH DE POLLO": [{ kardexId: "k_filete_pollo", qty: 1 }],
  "MILANESA DE POLLO": [{ kardexId: "k_milanesa", qty: 1 }],
  "FETUCCINI AL P.C/ MILANESA": [{ kardexId: "k_milanesa", qty: 1 }],
  "FETUCCINI A LO ALFR.C/ MILANESA": [{ kardexId: "k_milanesa", qty: 1 }],
  "FETUCCINI A LA H.C/ MILANESA": [{ kardexId: "k_milanesa", qty: 1 }],
  "MILANESA DE POLLO A LO POBRE": [{ kardexId: "k_milanesa", qty: 1 }],
  "RISOTTO PESTO C/MILANESA": [{ kardexId: "k_milanesa", qty: 1 }],
  "TACU TACU C/ MILANESA": [{ kardexId: "k_milanesa", qty: 1 }],
  "RISOTTO A LA H. C/MILANESA DE POLLO": [{ kardexId: "k_milanesa", qty: 1 }],
  "ENSALADA DOÑA FRESIA": [{ kardexId: "k_milanesa", qty: 0.5 }],
  "TACU TACU C/ BISTEC A LO POBRE": [{ kardexId: "k_bisteck", qty: 1 }],
  "BISTEC DE LOMO FINO A LO POBRE": [{ kardexId: "k_bisteck", qty: 1 }],
  "FETUCCINI AL P.C/ BISTEC DE LOMO 250 G": [{ kardexId: "k_bisteck", qty: 1 }],
  "FETUCCINI A LO ALFR.C/ BISTEC DE LOMO 250 G": [{ kardexId: "k_bisteck", qty: 1 }],
  "FETUCCINI A LA H.C/ BISTEC DE LOMO 250 G": [{ kardexId: "k_bisteck", qty: 1 }],
  "FETUCCINI AL P.C/ BISTEC DE LOMO APANADO": [{ kardexId: "k_bisteck", qty: 1 }],
  "FETUCCINI A LO ALFR.C/ BISTEC DE LOMO APANADO": [{ kardexId: "k_bisteck", qty: 1 }],
  "FETUCCINI A LA H.C/ BISTEC DE LOMO APANADO": [{ kardexId: "k_bisteck", qty: 1 }],
  "RISOTTO A LA H. BISTEC DE LOMO 250 G": [{ kardexId: "k_bisteck", qty: 1 }],
  "RISOTTO PESTO C/BISTEC DE LOMO 250 G": [{ kardexId: "k_bisteck", qty: 1 }],
  "BISTEC DE LOMO FINO A LA PLANCHA": [{ kardexId: "k_bisteck", qty: 1 }],
  "LOMO A LAS 3 PIMIENTAS": [{ kardexId: "k_bisteck", qty: 1 }],
  "LOMO FINO EN SALSA D CHAMPIÑONES": [{ kardexId: "k_bisteck", qty: 1 }],
  "BISTEC DE LOMO FINO APANADO": [{ kardexId: "k_bisteck", qty: 1 }],
  "TACU TACU C/LOMO FINO EN SALSA DE LANGOSTINOS": [{ kardexId: "k_bisteck", qty: 1 }, { kardexId: "k_langostinos_mariscos", qty: 1 }],
  "CHICHARRON DE POLLO C/ PAPAS FRITAS": [{ kardexId: "k_chicharron_pollo", qty: 1 }],
  "1/2 PORC. CHICHARRON DE POLLO": [{ kardexId: "k_chicharron_pollo", qty: 1 }],
  "CEVICHE MIXTO DE MARISCOS": [{ kardexId: "k_lenguado", qty: 1 }, { kardexId: "k_mixtura_ceviches", qty: 1 }],
  "CEVICHE DE LENGUADO": [{ kardexId: "k_lenguado", qty: 1 }],
  "LENGUADO A LA PLANCHA CON ARROZ": [{ kardexId: "k_lenguado", qty: 1 }],
  "LENGUADO A LO MACHO CON YUCA": [{ kardexId: "k_lenguado", qty: 1 }],
  "LENGUADO APANADA C/ARROZ Y FRIJOL": [{ kardexId: "k_lenguado", qty: 1 }],
  "LENGUADO ESCABECHADO C/ARROZ Y CAMOTE": [{ kardexId: "k_lenguado", qty: 1 }],
  "TACU TACU C/ LENGUADO EN SALSA DE LANGOSTINOS": [{ kardexId: "k_lenguado", qty: 1 }, { kardexId: "k_langostinos_mariscos", qty: 1 }],
  "TACU TACU C/LENGUADO EN SALSA DE MARISCOS": [{ kardexId: "k_lenguado", qty: 1 }, { kardexId: "k_mixtura_mariscos", qty: 1 }],
  "TIRADITO DE LENGUADO A LAS DOS CREMAS": [{ kardexId: "k_lenguado", qty: 1 }],
  "TIRADITO DE LENGUADO O SIMILAR": [{ kardexId: "k_lenguado", qty: 1 }],
  "CHICHARRON DE LENGUADO": [{ kardexId: "k_lenguado", qty: 1 }],
  "JALEA DE LENGUADO O SIMILAR": [{ kardexId: "k_lenguado", qty: 1 }],
  "LENGUADO O CORVINA FRITA C/ARROZ Y YUCA": [{ kardexId: "k_lenguado", qty: 1 }],
  "LENGUADO O CORVINA FRITA EN S/MARISCOS": [{ kardexId: "k_lenguado", qty: 1 }, { kardexId: "k_mixtura_mariscos", qty: 1 }],
  "LENGUADO O SIMILAR AL AJO C/ARROZ": [{ kardexId: "k_lenguado", qty: 1 }],
  "LENGUADO A LA MEUNIERE": [{ kardexId: "k_lenguado", qty: 1 }],
  "TACU TACU C/ LENGUADO A LO MACHO": [{ kardexId: "k_lenguado", qty: 1 }],
  "CHICHARRON MIXTO DE MARISCOS": [{ kardexId: "k_lenguado", qty: 1 }, { kardexId: "k_mixtura_mariscos", qty: 1 }],
  "FUENTE DE CEVICHE DE CORVINA O LENGUADO": [{ kardexId: "k_lenguado", qty: 2 }],
  "CAUSA DE LA CASA": [{ kardexId: "k_lenguado", qty: 1 }],
  "TACU TACU C/ LENGUDO EN SALSA DE LANGOSTINOS": [{ kardexId: "k_lenguado", qty: 1 }, { kardexId: "k_langostinos_mariscos", qty: 1 }],
  "CAUSA EN LAPA": [{ kardexId: "k_lenguado", qty: 1 }],
  "CORVINA SUDADA": [{ kardexId: "k_corvina", qty: 1 }],
  "CHUPE DE CORVINA": [{ kardexId: "k_corvina", qty: 1 }],
  "PULPO AL OLIVO 200G": [{ kardexId: "k_pulpo_olivo", qty: 1 }],
  "CEVICHE DE PULPO": [{ kardexId: "k_pulpo_olivo", qty: 1 }],
  "PULPO ANTICUCHERO 250G": [{ kardexId: "k_pulpo_anticuchero", qty: 1 }],
  "CAUSA DE PULPO AL OLIVO": [{ kardexId: "k_pulpo_causas", qty: 1 }],
  "TRES CAUSAS UNA PARRILLA": [{ kardexId: "k_pulpo_causas", qty: 0.5 }, { kardexId: "k_mixtura_mariscos", qty: 0.5 }, { kardexId: "k_langostino_causa", qty: 1 }],
  "CHUPE DE CAMARORES": [{ kardexId: "k_camaron", qty: 1 }],
  "CAMARONES AL AJO": [{ kardexId: "k_camaron", qty: 1 }],
  "CEVICHE DE CAMARONES": [{ kardexId: "k_camaron", qty: 1 }],
  "ARROZ CON CAMARONES": [{ kardexId: "k_camaron", qty: 1 }],
  "CAUSA DE CAMARONES": [{ kardexId: "k_camaron", qty: 1 }],
  "PIQUEO FRUTOS DEL MAR": [{ kardexId: "k_mixtura_mariscos", qty: 2 }],
  "ARROZ C/MARISCOS": [{ kardexId: "k_mixtura_mariscos", qty: 1 }],
  "TORTILLA DE MARISCOS C/ ARROZ": [{ kardexId: "k_mixtura_mariscos", qty: 1 }],
  "CHAUFA DE MARISCOS": [{ kardexId: "k_mixtura_mariscos", qty: 1 }],
  "PARIHUELA DE MARISCOS": [{ kardexId: "k_mixtura_mariscos", qty: 1 }],
  "PICANTE DE MARISCOS": [{ kardexId: "k_mixtura_mariscos", qty: 1 }],
  "TACU TACU EN SALSA DE MARISCOS": [{ kardexId: "k_mixtura_mariscos", qty: 1 }],
  "TRÍO DE CAUSAS": [{ kardexId: "k_mixtura_mariscos", qty: 1 }, { kardexId: "k_langostino_causa", qty: 1 }],
  "RISOTTO FRUTOS DEL MAR": [{ kardexId: "k_mixtura_mariscos", qty: 1 }],
  "LANGOSTINO THAI": [{ kardexId: "k_langostinos_mariscos", qty: 1 }],
  "LANGOSTINOS CROCANTES CON PALTA BRACEADA": [{ kardexId: "k_langostinos_mariscos", qty: 1 }],
  "ARROZ C/LANGOSTINOS": [{ kardexId: "k_langostinos_mariscos", qty: 1 }],
  "CAUSA DE LANGOSTINOS": [{ kardexId: "k_langostino_causa", qty: 1 }]
};

function normalizeName(name) {
  // normalize string, replace ñ, uppercase, remove accents if necessary
  return name.trim().toUpperCase()
    .replace(/Ñ/g, 'N')
    .replace(/\s+/g, ' ');
}

const normalizedMapping = {};
Object.keys(recipesMapping).forEach(k => {
  normalizedMapping[normalizeName(k)] = recipesMapping[k];
});

async function run() {
  console.log("Seeding kardex items and recipes into JSON databases...");

  // Update Global DB for recipes
  const globalPath = path.resolve(ROOT_DIR, 'db_global.json');
  if (fs.existsSync(globalPath)) {
    const globalDb = JSON.parse(fs.readFileSync(globalPath, 'utf8'));
    let updatedCount = 0;
    if (globalDb.catalogs) {
      globalDb.catalogs.forEach(cat => {
        if (cat.items) {
          cat.items.forEach(item => {
            const normItemName = normalizeName(item.name);
            // find exact match
            if (normalizedMapping[normItemName]) {
              item.kardexRecipe = normalizedMapping[normItemName];
              updatedCount++;
            } else {
              // try includes or partial match for those that might have weird chars
              const keys = Object.keys(normalizedMapping);
              const match = keys.find(k => normItemName.includes(k) || k.includes(normItemName));
              if (match) {
                 item.kardexRecipe = normalizedMapping[match];
                 updatedCount++;
              }
            }
          });
        }
      });
      // Insert kardexItems into globalDb
      const existingKardexItems = globalDb.kardexItems || [];
      const newKardexItems = [...existingKardexItems];
      kardexItems.forEach(ki => {
        if (!newKardexItems.find(x => x.id === ki.id)) {
          newKardexItems.push(ki);
        }
      });
      globalDb.kardexItems = newKardexItems;

      fs.writeFileSync(globalPath, JSON.stringify(globalDb, null, 2));
      console.log(`Updated ${updatedCount} recipes and kardexItems in db_global.json`);
    }
  } else {
    console.log("db_global.json not found.");
  }

  console.log("Seeding complete!");
}

run().catch(console.error);
