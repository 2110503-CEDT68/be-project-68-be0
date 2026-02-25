import express from 'express';
import prisma from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        tables: true,
        reservations: true
      }
    });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
      include: {
        tables: true,
        reservations: true
      }
    });
    if (restaurant) {
      res.json(restaurant);
    } else {
      res.status(404).json({ error: 'Restaurant not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, address, telephone_number, open_time, close_time } = req.body;
    const newRestaurant = await prisma.restaurant.create({
      data: {
        name,
        address,
        telephone_number,
        open_time: new Date(open_time),
        close_time: new Date(close_time),
      },
    });
    res.status(201).json(newRestaurant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create restaurant', details: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, address, telephone_number, open_time, close_time } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (telephone_number) updateData.telephone_number = telephone_number;
    if (open_time) updateData.open_time = new Date(open_time);
    if (close_time) updateData.close_time = new Date(close_time);

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(updatedRestaurant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update restaurant', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.restaurant.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete restaurant', details: error.message });
  }
});

export default router;
