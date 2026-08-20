const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { initMongo, seedMongo, appendAuditLog, getAuditLogs } = require('./db.cjs');
const authRoutes = require('./routes/auth.cjs');
const storeRoutes = require('./routes/store.cjs');
const peruApiRoutes = require('./routes/peruApi.cjs');
const { requireAuth } = require('./middleware/auth.cjs');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.resolve(__dirname, '../dist');

const app = express();

// Middlewares globales
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '10mb', strict: false }));

// Rutas Públicas (Autenticación)
app.use('/api/auth', authRoutes);

// Rutas de API Protegidas
app.use('/api/store', requireAuth, storeRoutes);
app.use('/api/peru', peruApiRoutes);

// Rutas de Auditoría
app.get('/api/audit/logs', requireAuth, async (req, res, next) => {
  try {
    const logs = await getAuditLogs();
    res.json(logs);
  } catch (e) {
    next(e);
  }
});

app.post('/api/audit/log', requireAuth, async (req, res, next) => {
  try {
    await appendAuditLog(req.body);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

app.post('/api/anular', (req, res) => {
  res.json({
    success: true,
    message: 'Simulación de anulación exitosa. (Stub)',
    ticket: '15912385102'
  });
});

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
