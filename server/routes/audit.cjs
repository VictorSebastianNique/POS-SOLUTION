const express = require('express');
const router = express.Router();
const { appendAuditLog, getAuditLogs } = require('../db.cjs');

router.post('/log', async (req, res, next) => {
  try {
    const logData = req.body;
    await appendAuditLog(logData);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/logs', async (req, res, next) => {
  try {
    const logs = await getAuditLogs();
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
