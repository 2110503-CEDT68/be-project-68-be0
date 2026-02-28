import express from "express";
import dotenv from "dotenv";
import { connectDB } from './db.js';

dotenv.config();

const app = express();
app.use(express.json());

import restaurantRoutes from './routes/restaurant.js';
import tableRoutes from './routes/table.js';

app.use('/api/restaurants', restaurantRoutes);
app.use('/api/tables', tableRoutes);

if (process.env.NODE_ENV !== 'test') {
    await connectDB();
    app.listen(process.env.PORT || 3000, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
}

export default app;