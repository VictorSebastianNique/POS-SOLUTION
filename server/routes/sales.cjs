const express = require('express');
const router = express.Router();

router.post('/pay', async (req, res, next) => {
  res.json({ message: 'Pay endpoint - Phase 2 implementation' });
});

router.post('/void', async (req, res, next) => {
  res.json({ message: 'Void endpoint - Phase 3 implementation' });
});

module.exports = router;
