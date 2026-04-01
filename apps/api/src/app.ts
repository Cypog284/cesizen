import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import trackerRoutes from './routes/trackerRoutes';
import pageRoutes from './routes/pageRoutes';
import emotionRoutes from './routes/emotionRoutes';
import userRoutes from './routes/userRoutes';

const app = express();

// ── Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ── Routes (MVC: routes → controllers → services → repositories)
app.use('/api/auth', authRoutes);
app.use('/api/tracker', trackerRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/emotions', emotionRoutes);
app.use('/api/users', userRoutes);

// ── Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'CESIZen API', version: '1.0.0' });
});

// ── 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
