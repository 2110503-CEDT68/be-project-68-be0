import express from 'express';
import Restaurant from '../models/Restaurant.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const restaurants = await Restaurant.findAllWithRelations();
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findWithRelations(req.params.id);
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
    const newRestaurant = await Restaurant.create({
      name,
      address,
      telephone_number,
      open_time: new Date(open_time),
      close_time: new Date(close_time),
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

    const updatedRestaurant = await Restaurant.update(req.params.id, updateData);
    res.json(updatedRestaurant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update restaurant', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Restaurant.delete(req.params.id);
    if (deleted) {
      res.json({ message: 'Restaurant deleted successfully' });
    } else {
      res.status(404).json({ error: 'Restaurant not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete restaurant', details: error.message });
  }
});

export default router;
