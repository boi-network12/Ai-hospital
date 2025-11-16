// src/routes/systemRoutes.ts
import { Router } from 'express';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import mongoose from 'mongoose';
import User from '../models/UserModel';  

const router = Router();
const execAsync = promisify(exec);

/**
 * Helper – get DB size (MongoDB)
 */
async function getDbSize() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database not initialized yet");
  }

  const adminDb = db.admin();
  const stats = await adminDb.command({ dbStats: 1 });

  return (stats.dataSize / 1024 / 1024).toFixed(1); // MB
}


/**
 * Helper – get AI load (you can replace with your own metric)
 * Here we just return CPU % of the Node process.
 */
function getAiLoad() {
  const usage = process.cpuUsage();
  const cpus = os.cpus().length;
  // very rough estimate
  return ((usage.user + usage.system) / 1000 / cpus).toFixed(1);
}

/**
 * GET /api/v1/system/health
 */
router.get('/health', async (req, res) => {
  try {
    const [dbSize] = await Promise.all([getDbSize()]);

    res.json({
      success: true,
      data: {
        aiLoad: `${getAiLoad()}%`,
        api: 'Online',
        storage: `${dbSize} MB`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, message });
  }
});

/**
 * GET /api/v1/system/activity
 * Returns the last 5 login events (you can extend to any activity)
 */
router.get('/activity', async (req, res) => {
  try {
    // Pull the latest sessions that are active & sort by lastActive
    const recent = await User.aggregate([
      { $unwind: '$sessions' },
      { $match: { 'sessions.active': true } },
      { $sort: { 'sessions.lastActive': -1 } },
      { $limit: 5 },
      {
        $project: {
          text: {
            $concat: [
              '$name',
              ' logged in (',
              { $dateToString: { format: '%Y-%m-%d %H:%M', date: '$sessions.lastActive' } },
              ')',
            ],
          },
          color: {
            $switch: {
              branches: [
                { case: { $eq: ['$role', 'admin'] }, then: 'bg-purple-500' },
                { case: { $eq: ['$role', 'doctor'] }, then: 'bg-blue-500' },
              ],
              default: 'bg-green-500',
            },
          },
        },
      },
    ]);

    res.json({ success: true, data: recent });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, message });
  }
});

/**
 * GET /api/v1/system/last-login/:userId
 * Returns the most recent session for a specific user
 */
router.get('/last-login/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('sessions name');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const latest = user.sessions
      ?.filter((s) => s.active)
      .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())[0];

    res.json({
      success: true,
      data: latest
        ? {
            time: new Date(latest.lastActive).toLocaleString(),
            location: latest.ipAddress ?? 'Unknown',
          }
        : null,
    });
  } catch (err: unknown) {
     const message = err instanceof Error ? err.message : "Unknown error";
     res.status(500).json({ success: false, message });
  }
});

export default router;