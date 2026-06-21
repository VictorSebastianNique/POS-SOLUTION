const express = require('express');
const cors = require('cors');
const path = require('path');
const { initMongo, seedMongo } = require('./db.cjs');
const storeRoutes = require('./routes/store.cjs');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.resolve(__dirname, '../dist');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Montar rutas de API
app.use('/api/store', storeRoutes);

// Servir estáticos en producción
app.use(express.static(DIST_DIR));

// Fallback para SPA (React Router)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.resolve(DIST_DIR, 'index.html'));
  } else {
    next();
  }
});

// Middleware de errores general
app.use((err, req, res, next) => {
  console.error('Error en API:', err);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

// Inicializar DB y servidor
async function startServer() {
  await initMongo();
  await seedMongo();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express Server running on port ${PORT}`);
  });
}

startServer();
