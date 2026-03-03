import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import restaurantRoutes from "./routes/restaurant.js";

import reservationRoutes from "./routes/reservations.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());

// Custom MongoDB sanitization middleware (Express 5 compatible)
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((key) => {
        if (key.startsWith("$") || key.includes(".")) {
          delete obj[key];
        } else if (typeof obj[key] === "object") {
          sanitize(obj[key]);
        }
      });
    }
    return obj;
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
});

app.use(helmet());
app.use(hpp());
app.use(cors());

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);

app.use("/api/reservations", reservationRoutes);

if (process.env.NODE_ENV !== "test") {
  try {
    await connectDB();
    console.log("Connected to database successfully!");

    const server = app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });

    process.on("unhandledRejection", (err) => {
      console.log(`Error: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
}

export default app;
