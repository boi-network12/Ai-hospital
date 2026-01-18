import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import connectDB from './src/config/db';
import errorHandler from './src/middlewares/errorHandler';
import apiRouter from './src/routes';
import { cleanupInvalidRatings } from './src/utils/ratingCleanup';
import { dateReminderMiddleware } from './src/middlewares/dateReminderMiddleware';
import { aiRateLimiter } from './src/middlewares/aiMiddleware';

const app = express();

// Middlewares
app.use(helmet());
// app.use(cors({
//   origin: process.env.FRONTEND_ORIGIN?.split(',') || '*',
//   credentials: true,
// }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Date reminder middleware
app.use(dateReminderMiddleware);

// AI rate limiter middleware
app.use('/api/v1/ai', aiRateLimiter);


// Routes
app.use('/api', apiRouter);

// Error handler
app.use(errorHandler);

// Connect to DB and start server
connectDB()
  .then(async () => {
    console.log("Database connected");

    // Run cleanup AFTER DB connection
    try {
      const result = await cleanupInvalidRatings();
      console.log("Cleanup result:", result);
    } catch (error) {
      console.error("Cleanup failed:", error);
    }

    // Start server only after DB + cleanup
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`🚀 REST API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });
  // server/index