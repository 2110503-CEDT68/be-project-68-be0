import mongoose from 'mongoose';

const ReservationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    restaurant_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    restaurant_name: {
        type: String
    },
    reservation_date: {
        type: Date,
        required: [true, 'Please add a reservation date']
    },
    quantity: {
        type: Number,
        default: 1,
        min: [1, 'Quantity must be at least 1']
    },
    table: {
        type: mongoose.Schema.ObjectId,
        ref: 'Table'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Reservation', ReservationSchema);