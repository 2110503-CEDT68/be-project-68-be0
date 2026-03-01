import express from 'express';
import Restaurant from '../models/Restaurant.js';
import Reservation from '../models/Reservation.js';
import reservationRouter from './reservations.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Re-route into reservation router for nested route
router.use('/:restaurantId/reservations', reservationRouter);

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

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, address, telephone_number, open_time, close_time } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: 'Please provide name and address' });
    }

    const defaultOpen = new Date();
    defaultOpen.setHours(8, 0, 0, 0);
    const defaultClose = new Date();
    defaultClose.setHours(16, 0, 0, 0);

    const newRestaurant = await Restaurant.create({
      name,
      address,
      telephone_number,
      open_time: open_time ? new Date(open_time) : defaultOpen,
      close_time: close_time ? new Date(close_time) : defaultClose,
    });
    res.status(201).json(newRestaurant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create restaurant', details: error.message });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

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

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    await Reservation.deleteByRestaurant(req.params.id);
    await Restaurant.delete(req.params.id);

    res.json({ success: true, message: 'Restaurant deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete restaurant', details: error.message });
  }
});

export default router;
