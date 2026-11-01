import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { db } from '../src/server/db/database';
import authRoutes from '../src/server/routes/authRoutes';
import userRoutes from '../src/server/routes/userRoutes';
import taskRoutes from '../src/server/routes/taskRoutes';
import notificationRoutes from '../src/server/routes/notificationRoutes';
import auditRoutes from '../src/server/routes/auditRoutes';
import managerRoutes from '../src/server/routes/managerRoutes';

dotenv.config();

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure DB is initialized before processing requests
let initPromise: Promise<void> | null = null;
app.use(async (req, res, next) => {
  try {
    if (!initPromise) {
      initPromise = db.init();
    }
    await initPromise;
  } catch (err) {
    console.error('[Vercel Serverless] DB init error:', err);
  }
  next();
});

// Mount all API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', auditRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'UP',
    platform: 'Vercel Serverless',
    company: 'AlMoosa Trading Company',
    timestamp: new Date().toISOString(),
  });
});

export default app;
