const express = require('express');
const { getGlobalData, writeGlobalData, getLocalData, writeLocalData, getSecureData, writeSecureData } = require('../db.cjs');

const router = express.Router();

// GET GLOBAL
router.get('/global', async (req, res, next) => {
  try {
    const data = await getGlobalData();
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// GET LOCAL
router.get('/local/:locId', async (req, res, next) => {
  try {
    const data = await getLocalData(req.params.locId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// POST GLOBAL
router.post('/global/:key', async (req, res, next) => {
  try {
    await writeGlobalData(req.params.key, req.body);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// POST LOCAL
router.post('/local/:locId/:key', async (req, res, next) => {
  try {
    await writeLocalData(req.params.locId, req.params.key, req.body);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// GET SECURE BILLING
router.get('/secure/billing', async (req, res, next) => {
  try {
    const data = await getSecureData();
    res.json(data.billingCredentials || {});
  } catch (e) {
    next(e);
  }
});

// POST SECURE BILLING
router.post('/secure/billing', async (req, res, next) => {
  try {
    await writeSecureData('billingCredentials', req.body);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
