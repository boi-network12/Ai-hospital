import os from 'os';
import { Server } from 'socket.io';
import { SocketUser } from '../models/types';

export class HealthMetricsCollector {
  static collectSystemMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = process.memoryUsage();
    
    return {
      platform: process.platform,
      nodeVersion: process.version,
      memory: {
        total: `${Math.round(totalMem / (1024 * 1024))} MB`,
        free: `${Math.round(freeMem / (1024 * 1024))} MB`,
        usage: `${Math.round((1 - freeMem / totalMem) * 100)}%`,
        rss: `${Math.round(memoryUsage.rss / (1024 * 1024))} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / (1024 * 1024))} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / (1024 * 1024))} MB`,
      },
      loadAverage: os.loadavg(),
      cpuCount: os.cpus().length,
    };
  }

  static collectSocketMetrics(io: Server, activeUsers: Map<string, SocketUser>) {
    const sockets = io.sockets.sockets;
    const transportStats: Record<string, number> = {};
    
    // Count transport types
    sockets.forEach((socket) => {
      const transport = socket.conn.transport.name;
      transportStats[transport] = (transportStats[transport] || 0) + 1;
    });

    return {
      totalConnections: io.engine.clientsCount,
      activeSockets: sockets.size,
      activeUsers: activeUsers.size,
      transportTypes: transportStats,
    };
  }

  static getUptime() {
    return process.uptime();
  }
}