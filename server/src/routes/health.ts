import express from 'express';

const router = express.Router();

// Simple health check route
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
