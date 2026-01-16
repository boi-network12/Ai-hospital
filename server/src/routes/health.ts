import express from 'express';
import mongoose from 'mongoose'; // If using MongoDB
import os from 'os';

const router = express.Router();

// Enhanced health check with system diagnostics - FIXED VERSION
router.get('/', async (req, res) => {
  // Define the type for our health check response
  interface HealthCheckResponse {
    success: boolean;
    message: string;
    timestamp: string;
    service: string;
    uptime: number;
    system: {
      platform: string;
      nodeVersion: string;
      memory: {
        total: string;
        free: string;
        usage: string;
      };
      loadAverage: number[];
      cpuCount: number;
    };
    application: {
      pid: number;
      env: string;
      database: string;
      databaseState?: number;
      databaseStatus?: string;
      databaseError?: string;
      databaseStates?: Record<number, string>;
    };
    error?: string;
  }

  // Initialize the health check object
  const healthCheck: HealthCheckResponse = {
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    service: 'neuromed-backend',
    uptime: process.uptime(),
    
    // System information
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      memory: {
        total: `${Math.round(os.totalmem() / (1024 * 1024))} MB`,
        free: `${Math.round(os.freemem() / (1024 * 1024))} MB`,
        usage: `${Math.round((1 - os.freemem() / os.totalmem()) * 100)}%`
      },
      loadAverage: os.loadavg(),
      cpuCount: os.cpus().length
    },
    
    // Application status
    application: {
      pid: process.pid,
      env: process.env.NODE_ENV || 'development',
      database: 'unknown'
    }
  };

  try {
    // Safely check database connection
    const dbState = mongoose.connection.readyState;
    
    switch (dbState) {
      case 1: // Connected
        healthCheck.application.database = 'connected';
        healthCheck.application.databaseState = dbState;
        
        // Safe database ping with optional chaining
        if (mongoose.connection.db) {
          try {
            await mongoose.connection.db.admin().ping();
            healthCheck.application.databaseStatus = 'healthy';
          } catch (pingError: any) {
            healthCheck.application.databaseStatus = 'ping_failed';
            healthCheck.application.databaseError = pingError.message;
          }
        } else {
          healthCheck.application.databaseStatus = 'no_db_reference';
        }
        break;
        
      case 2: // Connecting
        healthCheck.application.database = 'connecting';
        healthCheck.application.databaseState = dbState;
        break;
        
      case 3: // Disconnecting
        healthCheck.application.database = 'disconnecting';
        healthCheck.application.databaseState = dbState;
        break;
        
      case 0: // Disconnected
      default:
        healthCheck.application.database = 'disconnected';
        healthCheck.application.databaseState = dbState;
        break;
    }
    
    // Add database state codes for reference
    healthCheck.application.databaseStates = {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.status(200).json(healthCheck);
    
  } catch (error: any) {
    // Still respond with 200 but indicate partial failure
    healthCheck.success = false;
    healthCheck.message = 'API has issues';
    healthCheck.error = error.message;
    healthCheck.application.database = 'error';
    
    res.status(200).json(healthCheck);
  }
});

// Alternative: Simpler database check without ping
router.get('/simple', async (req, res) => {
  const healthCheck = {
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'disconnected'
  };

  // Just check connection state without ping
  const dbState = mongoose.connection.readyState;
  
  if (dbState === 1) {
    healthCheck.database = 'connected';
  } else if (dbState === 2) {
    healthCheck.database = 'connecting';
  }
  
  res.status(200).json(healthCheck);
});

// Simple health check for load balancers/uptime monitors
router.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// Database-specific health check with proper typing
router.get('/database', async (req, res) => {
  // Define the base structure with all possible properties
  const dbCheck: any = {
    timestamp: new Date().toISOString(),
    connectionState: mongoose.connection.readyState,
    connectionStates: {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting', 
      3: 'disconnecting'
    },
    host: mongoose.connection.host || 'not connected',
    port: mongoose.connection.port || 0,
    name: mongoose.connection.name || 'not connected',
    models: Object.keys(mongoose.connection.models || {})
  };

  // Try to perform an actual database operation
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    try {
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      dbCheck.pingTime = `${Date.now() - startTime}ms`;
      dbCheck.status = 'healthy';
    } catch (error: any) {
      dbCheck.status = 'unhealthy';
      dbCheck.error = error.message;
    }
  } else {
    dbCheck.status = 'not_connected';
  }

  res.status(200).json(dbCheck);
});
// Detailed diagnostic endpoint
router.get('/diagnostics', (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    process: {
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    },
    database: {
      state: mongoose.connection.readyState,
      host: mongoose.connection.host || 'not connected',
      name: mongoose.connection.name || 'not connected'
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
    },
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      uptime: os.uptime()
    }
  };
  
  res.status(200).json(diagnostics);
});

export default router;