import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import http from 'http';
import { initSocket } from './src/socket';
import connectDB from './src/config/db';
import errorHandler from './src/middlewares/errorHandler';
import apiRouter from './src/routes';
import { cleanupInvalidRatings } from './src/utils/ratingCleanup';
import { dateReminderMiddleware } from './src/middlewares/dateReminderMiddleware';
import { corsDebug, corsTestEndpoint } from './src/middlewares/corsDebug';
import { getCorsOptions } from './src/config/corsConfig';

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Apply CORS debug middleware (should be before actual CORS)
if (process.env.NODE_ENV === 'development') {
  app.use(corsDebug);
}

// Apply CORS with dynamic configuration
app.use(cors(getCorsOptions()));

// Add CORS test endpoint
app.get('/api/cors-test', corsTestEndpoint);

// Other middlewares
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Date reminder middleware
app.use(dateReminderMiddleware);

// Routes
app.use('/api', apiRouter);

// Error handler
app.use(errorHandler);

// Initialize Socket.IO
initSocket(server);

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
    server.listen(PORT, () => {
      console.log(`SERVER RUNNING ON PORT ${PORT}`);
      console.log(`Socket.IO server initialized`);
      console.log('🌐 CORS configured for origins:', process.env.FRONTEND_ORIGIN);
    });
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
});