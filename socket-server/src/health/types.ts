import { SocketUser } from '../models/types';

export interface HealthMetrics {
  timestamp: string;
  uptime: number;
  system: {
    platform: string;
    nodeVersion: string;
    memory: {
      total: string;
      free: string;
      usage: string;
      rss: string;
      heapTotal: string;
      heapUsed: string;
    };
    loadAverage: number[];
    cpuCount: number;
  };
  socket: {
    totalConnections: number;
    activeSockets: number;
    activeUsers: number;
    transportTypes: Record<string, number>;
  };
  performance: {
    responseTime?: string;
    pingTime?: string;
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  timestamp: string;
  service: string;
  version?: string;
  metrics: HealthMetrics;
  activeUsers?: Array<SocketUser & { isOnline: boolean }>;
}

export interface DatabaseHealth {
  status: 'connected' | 'disconnected' | 'error';
  responseTime?: string;
  error?: string;
}