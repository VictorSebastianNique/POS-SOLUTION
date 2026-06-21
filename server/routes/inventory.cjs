const express = require('express');
const router = express.Router();

router.get('/items', async (req, res, next) => {
  res.json([]);
});

module.exports = router;
