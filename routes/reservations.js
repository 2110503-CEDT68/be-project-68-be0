import express from 'express';
import { getReservations, getReservation, addReservation, updateReservation, deleteReservation } from '../controllers/reservations.js';
import { protect } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/').get(getReservations).post(addReservation);
router.route('/:id').get(getReservation).put(updateReservation).delete(deleteReservation);

export default router;
