const express = require('express');
const router = express.Router();

// Como el servidor Node puede ser v18+, usaremos fetch nativo
router.get('/dni/:numero', async (req, res) => {
  try {
    const { numero } = req.params;
    const token = req.headers['x-api-token'] || process.env.PERU_API_TOKEN;

    if (!token) {
      return res.status(401).json({ error: 'No API token provided' });
    }

    // Usando el formato de decolecta para DNI
    const response = await fetch(`https://api.decolecta.com/v1/reniec/dni?numero=${numero}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Error from third-party API' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error in DNI proxy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/ruc/:numero', async (req, res) => {
  try {
    const { numero } = req.params;
    const token = req.headers['x-api-token'] || process.env.PERU_API_TOKEN;
    const isFull = req.query.full === 'true';

    if (!token) {
      return res.status(401).json({ error: 'No API token provided' });
    }

    const endpoint = isFull 
      ? `https://api.decolecta.com/v1/sunat/ruc/full?numero=${numero}`
      : `https://api.decolecta.com/v1/sunat/ruc?numero=${numero}`;

    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Error from third-party API' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error in RUC proxy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/tipo-cambio', async (req, res) => {
  try {
    const token = req.headers['x-api-token'] || process.env.PERU_API_TOKEN;

    if (!token) {
      return res.status(401).json({ error: 'No API token provided' });
    }

    const response = await fetch(`https://api.decolecta.com/v1/tipo-cambio/sunat`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Error from third-party API' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error in Exchange Rate proxy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
