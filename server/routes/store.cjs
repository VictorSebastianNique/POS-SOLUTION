const express = require('express');
const { getGlobalData, writeGlobalData, getLocalData, writeLocalData, getSecureData, writeSecureData } = require('../db.cjs');
const { requireRole } = require('../middleware/auth.cjs');

const router = express.Router();

// GET GLOBAL — cualquier usuario autenticado puede leer la configuración global (menú, zonas, etc.)
router.get('/global', async (req, res, next) => {
  try {
    const data = await getGlobalData();
    // No exponer contraseñas de usuarios en respuestas globales
    if (data.users) {
      data.users = data.users.map(u => { const s = { ...u }; delete s.password; return s; });
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// GET LOCAL — solo puede acceder a su propia sede (o superadmin/admin a cualquiera)
router.get('/local/:locId', async (req, res, next) => {
  try {
    const { role, locationId } = req.user;
    const requestedLocId = req.params.locId;

    if (role !== 'superadmin' && role !== 'admin' && locationId !== requestedLocId) {
      return res.status(403).json({ success: false, error: 'Acceso denegado: no puedes ver datos de otra sede' });
    }

    const data = await getLocalData(requestedLocId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// POST GLOBAL — solo superadmin y admin pueden modificar datos globales
router.post('/global/:key', requireRole('superadmin', 'admin'), async (req, res, next) => {
  try {
    await writeGlobalData(req.params.key, req.body);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// POST LOCAL — solo puede escribir en su propia sede (o superadmin/admin a cualquiera)
router.post('/local/:locId/:key', async (req, res, next) => {
  try {
    const { role, locationId } = req.user;
    const requestedLocId = req.params.locId;

    if (role !== 'superadmin' && role !== 'admin' && locationId !== requestedLocId) {
      return res.status(403).json({ success: false, error: 'Acceso denegado: no puedes modificar datos de otra sede' });
    }

    await writeLocalData(requestedLocId, req.params.key, req.body);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// GET SECURE BILLING — solo superadmin puede ver credenciales de facturación
router.get('/secure/billing', requireRole('superadmin'), async (req, res, next) => {
  try {
    const data = await getSecureData();
    res.json(data.billingCredentials || {});
  } catch (e) {
    next(e);
  }
});

// POST SECURE BILLING — solo superadmin puede modificar credenciales de facturación
router.post('/secure/billing', requireRole('superadmin'), async (req, res, next) => {
  try {
    await writeSecureData('billingCredentials', req.body);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

