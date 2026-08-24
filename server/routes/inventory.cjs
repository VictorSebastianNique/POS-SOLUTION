const express = require('express');
const { getInventoryData, insertInventoryData, updateInventoryData, appendAuditLog } = require('../db.cjs');
const router = express.Router();

// GET Catalog
router.get('/catalog', async (req, res, next) => {
  try {
    const catalog = await getInventoryData('inventory_catalog');
    res.json(catalog);
  } catch (e) {
    next(e);
  }
});

// POST Catalog (Add or Update)
router.post('/catalog', async (req, res, next) => {
  try {
    const item = req.body;
    const existing = await getInventoryData('inventory_catalog', { barcode: item.barcode });
    if (existing && existing.length > 0) {
      await updateInventoryData('inventory_catalog', { barcode: item.barcode }, { $set: item });
    } else {
      await insertInventoryData('inventory_catalog', { ...item, created_at: new Date().toISOString() });
    }
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// GET Batches
router.get('/batches', async (req, res, next) => {
  try {
    const batches = await getInventoryData('inventory_batches');
    res.json(batches);
  } catch (e) {
    next(e);
  }
});

// POST Receive Batch
router.post('/batches/receive', async (req, res, next) => {
  try {
    const batch = req.body;
    await insertInventoryData('inventory_batches', {
      ...batch,
      current_quantity: batch.initial_quantity,
      status: 'ACTIVE',
      entry_date: new Date().toISOString()
    });
    await insertInventoryData('inventory_transactions', {
      transaction_type: 'IN',
      product_barcode: batch.product_barcode,
      batch_number: batch.batch_number,
      quantity: batch.initial_quantity,
      trigger: 'RECEIVE',
      timestamp: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// POST FEFO Consume
router.post('/fefo-consume', async (req, res, next) => {
  try {
    const { items, trigger, reference_id, user } = req.body; // items: [{barcode, qty}]
    
    for (const reqItem of items) {
      let qtyToFulfill = reqItem.qty;
      const batches = await getInventoryData('inventory_batches', { product_barcode: reqItem.barcode, status: 'ACTIVE' });
      
      // Sort batches by expiration date ascending (FEFO)
      batches.sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));
      
      for (const batch of batches) {
        if (qtyToFulfill <= 0) break;
        
        const deduct = Math.min(batch.current_quantity, qtyToFulfill);
        batch.current_quantity -= deduct;
        qtyToFulfill -= deduct;
        
        const newStatus = batch.current_quantity <= 0 ? 'DEPLETED' : 'ACTIVE';
        
        await updateInventoryData('inventory_batches', { batch_number: batch.batch_number }, {
          $set: { current_quantity: batch.current_quantity, status: newStatus }
        });
        
        await insertInventoryData('inventory_transactions', {
          transaction_type: 'OUT',
          product_barcode: reqItem.barcode,
          batch_number: batch.batch_number,
          quantity: deduct,
          trigger: trigger || 'SALE',
          reference_id: reference_id,
          user: user,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
