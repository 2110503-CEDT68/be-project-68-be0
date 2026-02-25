import express from 'express';
import prisma from '../db.js';

const router = express.Router();

// GET all tables
router.get('/', async (req, res) => {
  try {
    const { restaurant_id } = req.query;
    
    const query = {};
    if (restaurant_id) {
      query.where = { restaurant_id };
    }
    
    const tables = await prisma.table.findMany(query);
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// GET single table
router.get('/:id', async (req, res) => {
  try {
    const table = await prisma.table.findUnique({
      where: { id: req.params.id },
    });
    if (table) {
      res.json(table);
    } else {
      res.status(404).json({ error: 'Table not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch table' });
  }
});

// POST new table
router.post('/', async (req, res) => {
  try {
    const { restaurant_id, capacity, status } = req.body;
    
    const newTable = await prisma.table.create({
      data: {
        restaurant_id,
        capacity: parseInt(capacity, 10),
        status: status || 'AVAILABLE',
      },
    });
    res.status(201).json(newTable);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create table', details: error.message });
  }
});

// PUT update table
router.put('/:id', async (req, res) => {
  try {
    const { restaurant_id, capacity, status } = req.body;
    
    // Build update data
    const updateData = {};
    if (restaurant_id) updateData.restaurant_id = restaurant_id;
    if (capacity !== undefined) updateData.capacity = parseInt(capacity, 10);
    if (status) updateData.status = status;

    const updatedTable = await prisma.table.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(updatedTable);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update table', details: error.message });
  }
});

// DELETE table
router.delete('/:id', async (req, res) => {
  try {
    await prisma.table.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete table', details: error.message });
  }
});

export default router;
