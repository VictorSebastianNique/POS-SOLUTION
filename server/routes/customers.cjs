const express = require('express');
const router = express.Router();
const { getDb } = require('../db.cjs');

// GET /api/customers/:numero - Buscar cliente por DNI/RUC
router.get('/:numero', async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Base de datos no disponible' });
    }

    const customer = await db.collection('customers').findOne({ documentNumber: req.params.numero });
    
    if (customer) {
      res.json(customer);
    } else {
      res.status(404).json({ error: 'Cliente no encontrado' });
    }
  } catch (err) {
    console.error('Error fetching customer:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/customers - Crear o actualizar cliente
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Base de datos no disponible' });
    }

    const { documentType, documentNumber, name, address } = req.body;

    if (!documentNumber || !name) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const customerData = {
      documentType,
      documentNumber,
      name,
      address: address || '',
      updatedAt: new Date()
    };

    // Upsert (actualizar si existe, crear si no existe)
    await db.collection('customers').updateOne(
      { documentNumber },
      { $set: customerData },
      { upsert: true }
    );

    res.json({ success: true, customer: customerData });
  } catch (err) {
    console.error('Error saving customer:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
