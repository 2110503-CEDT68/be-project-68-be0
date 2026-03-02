import mongoose from 'mongoose';

const TableSchema = new mongoose.Schema({
    restaurant_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'Restaurant',
        required: [true, 'Please add a restaurant_id']
    },
    capacity: {
        type: Number,
        required: [true, 'Please add a capacity'],
        min: [1, 'Capacity must be at least 1']
    },
    status: {
        type: String,
        enum: ['AVAILABLE', 'UNAVAILABLE'],
        default: 'AVAILABLE'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Table', TableSchema);