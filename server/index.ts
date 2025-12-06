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

const app = express();

// Connect to DB
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
    app.listen(PORT, () => console.log(`SERVER RUNNING ON PORT ${PORT}`));
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api', apiRouter);

// Error handler
app.use(errorHandler);
