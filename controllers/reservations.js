import Reservation from '../models/Reservation.js';
import Restaurant from '../models/Restaurant.js';

// @desc    Get all reservations (admin) or own reservations (user)
// @route   GET /api/reservations
// @access  Private
export const getReservations = async (req, res) => {
    try {
        let query = {};

        if (req.params.restaurantId) {
            query.restaurant_id = req.params.restaurantId;
        }

        if (req.user.role !== 'admin') {
            query.user = req.user.id;
        }

        const reservations = await Reservation.findAll(query);

        res.status(200).json({ success: true, count: reservations.length, data: reservations });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Cannot find reservations' });
    }
};

// @desc    Get single reservation
// @route   GET /api/reservations/:id
// @access  Private
export const getReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({ success: false, message: `No reservation with the id of ${req.params.id}` });
        }

        if (reservation.user.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to view this reservation` });
        }

        res.status(200).json({ success: true, data: reservation });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Cannot find reservation' });
    }
};

// @desc    Add reservation
// @route   POST /api/restaurants/:restaurantId/reservations
// @access  Private
export const addReservation = async (req, res) => {
    try {
        const restaurant_id = req.params.restaurantId;
        const { reservation_date } = req.body;

        if (!reservation_date) {
            return res.status(400).json({ success: false, message: 'Please provide reservation_date' });
        }

        const resDate = new Date(reservation_date);

        if (isNaN(resDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid reservation_date format' });
        }

        if (resDate <= new Date()) {
            return res.status(400).json({ success: false, message: 'Reservation date must be in the future' });
        }

        const restaurant = await Restaurant.findById(restaurant_id);

        if (!restaurant) {
            return res.status(404).json({ success: false, message: `No restaurant with the id of ${restaurant_id}` });
        }

        if (restaurant.open_time && restaurant.close_time) {
            const resHours = resDate.getHours();
            const resMinutes = resDate.getMinutes();
            const resTotalMinutes = resHours * 60 + resMinutes;

            const openTime = new Date(restaurant.open_time);
            const closeTime = new Date(restaurant.close_time);
            const openMinutes = openTime.getHours() * 60 + openTime.getMinutes();
            const closeMinutes = closeTime.getHours() * 60 + closeTime.getMinutes();

            if (resTotalMinutes < openMinutes || resTotalMinutes > closeMinutes) {
                return res.status(400).json({ success: false, message: `Restaurant is open from ${openTime.toTimeString().slice(0, 5)} to ${closeTime.toTimeString().slice(0, 5)}` });
            }
        }

        const existingReservations = await Reservation.findByUser(req.user.id);

        if (existingReservations.length >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({ success: false, message: `The user with ID ${req.user.id} has already made 3 reservations` });
        }

        const sameDayStart = new Date(resDate);
        sameDayStart.setHours(0, 0, 0, 0);
        const sameDayEnd = new Date(resDate);
        sameDayEnd.setHours(23, 59, 59, 999);

        const duplicate = existingReservations.find(r =>
            r.restaurant_id === restaurant_id &&
            new Date(r.reservation_date) >= sameDayStart &&
            new Date(r.reservation_date) <= sameDayEnd
        );

        if (duplicate) {
            return res.status(400).json({ success: false, message: 'You already have a reservation at this restaurant on this date' });
        }

        const reservation = await Reservation.create({
            user: req.user.id,
            restaurant_id,
            restaurant_name: restaurant.name,
            reservation_date: resDate,
            quantity: parseInt(req.body.quantity) || 1
        });

        res.status(201).json({ success: true, data: reservation });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Cannot create reservation' });
    }
};

// @desc    Update reservation
// @route   PUT /api/reservations/:id
// @access  Private
export const updateReservation = async (req, res) => {
    try {
        let reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({ success: false, message: `No reservation with the id of ${req.params.id}` });
        }

        if (reservation.user.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to update this reservation` });
        }

        const updateData = {};

        if (req.body.reservation_date) {
            const resDate = new Date(req.body.reservation_date);

            if (resDate <= new Date()) {
                return res.status(400).json({ success: false, message: 'Reservation date must be in the future' });
            }

            const restaurantId = req.body.restaurant_id || reservation.restaurant_id;
            const restaurant = await Restaurant.findById(restaurantId);

            if (restaurant && restaurant.open_time && restaurant.close_time) {
                const resTotalMinutes = resDate.getHours() * 60 + resDate.getMinutes();
                const openMinutes = new Date(restaurant.open_time).getHours() * 60 + new Date(restaurant.open_time).getMinutes();
                const closeMinutes = new Date(restaurant.close_time).getHours() * 60 + new Date(restaurant.close_time).getMinutes();

                if (resTotalMinutes < openMinutes || resTotalMinutes > closeMinutes) {
                    return res.status(400).json({ success: false, message: `Restaurant is open from ${new Date(restaurant.open_time).toTimeString().slice(0, 5)} to ${new Date(restaurant.close_time).toTimeString().slice(0, 5)}` });
                }
            }

            updateData.reservation_date = resDate;
        }

        if (req.body.restaurant_id) updateData.restaurant_id = req.body.restaurant_id;

        reservation = await Reservation.update(req.params.id, updateData);

        res.status(200).json({ success: true, data: reservation });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Cannot update reservation' });
    }
};

// @desc    Delete reservation
// @route   DELETE /api/reservations/:id
// @access  Private
export const deleteReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({ success: false, message: `No reservation with the id of ${req.params.id}` });
        }

        if (reservation.user.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to delete this reservation` });
        }

        if (req.user.role !== 'admin') {
            const timeDiff = new Date(reservation.reservation_date) - new Date();
            if (timeDiff < 60 * 60 * 1000) {
                return res.status(400).json({ success: false, message: 'Cannot cancel reservation within 1 hour of reservation time' });
            }
        }

        await Reservation.delete(req.params.id);

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Cannot delete reservation' });
    }
};
