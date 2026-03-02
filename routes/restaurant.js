import express from 'express';
import {getRestaurants, getRestaurant, createRestaurant, updateRestaurant, deleteRestaurant} from '../controllers/restaurants.js';

// Include other resource routers
import reservationRouter from './reservations.js';

const router = express.Router();

import {protect, authorize} from '../middleware/auth.js';

// Re-route into other resource routers
router.use('/:restaurantId/reservations/', reservationRouter);

router.route('/').get(getRestaurants).post(protect, authorize('admin'), createRestaurant);
router.route('/:id').get(getRestaurant).put(protect, authorize('admin'), updateRestaurant).delete(protect, authorize('admin'), deleteRestaurant);

export default router;