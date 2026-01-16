import express, { Request, Response } from 'express';
import { Server } from 'socket.io';
import { SocketUser } from '../models/types';
import { HealthMetricsCollector } from './metrics';
import { HealthCheckResponse, DatabaseHealth } from './types';

export class HealthRouter {
  private io: Server;
  private activeUsers: Map<string, SocketUser>;
  private serviceName: string;
  private serviceVersion: string;

  constructor(io: Server, activeUsers: Map<string, SocketUser>) {
    this.io = io;
    this.activeUsers = activeUsers;
    this.serviceName = process.env.SERVICE_NAME || 'socket-server';
    this.serviceVersion = process.env.npm_package_version || '1.0.0';
  }

  private async checkExternalServices(): Promise<DatabaseHealth> {
    // Add checks for external services (MongoDB, Redis, etc.)
    // This is a template - implement based on your actual dependencies
    return {
      status: 'connected',
      responseTime: '5ms',
    };
  }

  async getHealth(req: Request, res: Response) {
    const startTime = Date.now();
    
    try {
      // Collect all metrics
      const systemMetrics = HealthMetricsCollector.collectSystemMetrics();
      const socketMetrics = HealthMetricsCollector.collectSocketMetrics(this.io, this.activeUsers);
      const externalServices = await this.checkExternalServices();
      
      // Determine overall status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (socketMetrics.totalConnections === 0 && socketMetrics.activeUsers > 0) {
        status = 'degraded';
      }
      if (externalServices.status === 'error') {
        status = 'unhealthy';
      }

      // Build response
      const response: HealthCheckResponse = {
        status,
        message: status === 'healthy' ? 'Service is operating normally' 
                : status === 'degraded' ? 'Service is experiencing issues' 
                : 'Service is unavailable',
        timestamp: new Date().toISOString(),
        service: this.serviceName,
        version: this.serviceVersion,
        metrics: {
          timestamp: new Date().toISOString(),
          uptime: HealthMetricsCollector.getUptime(),
          system: systemMetrics,
          socket: socketMetrics,
          performance: {
            responseTime: `${Date.now() - startTime}ms`,
          },
        },
      };

      // Include active users in detailed mode
      if (req.query.detailed === 'true') {
        response.activeUsers = Array.from(this.activeUsers.values()).map(user => ({
          ...user,
          isOnline: true,
        }));
      }

      res.status(status === 'unhealthy' ? 503 : 200).json(response);
      
    } catch (error: any) {
      res.status(500).json({
        status: 'unhealthy',
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
        error: error.message,
        metrics: {
          timestamp: new Date().toISOString(),
          uptime: HealthMetricsCollector.getUptime(),
          system: HealthMetricsCollector.collectSystemMetrics(),
          socket: { totalConnections: 0, activeSockets: 0, activeUsers: 0, transportTypes: {} },
          performance: { responseTime: `${Date.now() - startTime}ms` },
        },
      });
    }
  }

  getLiveness(req: Request, res: Response) {
    // Simple liveness probe for Kubernetes/load balancers
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: HealthMetricsCollector.getUptime(),
    });
  }

  getReadiness(req: Request, res: Response) {
    // Readiness probe - check if service is ready to accept traffic
    const socketMetrics = HealthMetricsCollector.collectSocketMetrics(this.io, this.activeUsers);
    
    const isReady = socketMetrics.totalConnections < 1000; // Example capacity limit
    
    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      connections: socketMetrics.totalConnections,
      maxConnections: 1000,
    });
  }

  getMetrics(req: Request, res: Response) {
    // Prometheus-style metrics endpoint
    const system = HealthMetricsCollector.collectSystemMetrics();
    const socket = HealthMetricsCollector.collectSocketMetrics(this.io, this.activeUsers);
    
    const metrics = [
      `# HELP socket_server_connections_total Total number of socket connections`,
      `# TYPE socket_server_connections_total gauge`,
      `socket_server_connections_total ${socket.totalConnections}`,
      '',
      `# HELP socket_server_active_users Active users count`,
      `# TYPE socket_server_active_users gauge`,
      `socket_server_active_users ${socket.activeUsers}`,
      '',
      `# HELP socket_server_memory_usage_bytes Memory usage in bytes`,
      `# TYPE socket_server_memory_usage_bytes gauge`,
      `socket_server_memory_usage_bytes ${process.memoryUsage().rss}`,
      '',
      `# HELP socket_server_uptime_seconds Service uptime in seconds`,
      `# TYPE socket_server_uptime_seconds gauge`,
      `socket_server_uptime_seconds ${HealthMetricsCollector.getUptime()}`,
    ].join('\n');

    res.set('Content-Type', 'text/plain').send(metrics);
  }

  getRoutes() {
    const router = express.Router();
    
    router.get('/health', this.getHealth.bind(this));
    router.get('/live', this.getLiveness.bind(this));
    router.get('/ready', this.getReadiness.bind(this));
    router.get('/metrics', this.getMetrics.bind(this));
    
    return router;
  }
}