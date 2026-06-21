const express = require('express');
const router = express.Router();

router.post('/log', async (req, res, next) => {
  res.json({ success: true });
});

router.get('/log', async (req, res, next) => {
  res.json([]);
});

module.exports = router;
