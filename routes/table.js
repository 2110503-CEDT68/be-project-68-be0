import express from 'express';
import Table from '../models/Table.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { restaurant_id } = req.query;
    
    const filter = {};
    if (restaurant_id) {
      filter.restaurant_id = restaurant_id;
    }
    
    const tables = await Table.findAll(filter);
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (table) {
      res.json(table);
    } else {
      res.status(404).json({ error: 'Table not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch table' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { restaurant_id, capacity, status } = req.body;
    
    const newTable = await Table.create({
      restaurant_id,
      capacity: parseInt(capacity, 10),
      status: status || 'AVAILABLE',
    });
    res.status(201).json(newTable);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create table', details: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { restaurant_id, capacity, status } = req.body;
    
    // Build update data
    const updateData = {};
    if (restaurant_id) updateData.restaurant_id = restaurant_id;
    if (capacity !== undefined) updateData.capacity = parseInt(capacity, 10);
    if (status) updateData.status = status;

    const updatedTable = await Table.update(req.params.id, updateData);
    res.json(updatedTable);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update table', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Table.delete(req.params.id);
    if (deleted) {
      res.json({ message: 'Table deleted successfully' });
    } else {
      res.status(404).json({ error: 'Table not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete table', details: error.message });
  }
});

export default router;
