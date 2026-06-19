import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import trackerRoutes from './routes/trackerRoutes';
import pageRoutes from './routes/pageRoutes';
import emotionRoutes from './routes/emotionRoutes';
import userRoutes from './routes/userRoutes';

const app = express();

// ── Sécurité : en-têtes HTTP (Helmet)
// Ajoute automatiquement : Content-Security-Policy, X-Frame-Options,
// X-Content-Type-Options, Strict-Transport-Security, etc.
app.use(helmet());

// ── Sécurité : CORS restreint aux origines autorisées
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (outils CLI, health checks)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloqué pour l'origine : ${origin}`));
    }
  },
  credentials: true,
}));

// ── Sécurité : limite de taille des payloads (anti-DoS)
app.use(express.json({ limit: '10kb' }));

// ── Sécurité : rate limiting global (anti-flood)
// Désactivé en environnement de test pour ne pas bloquer les suites Jest
const isTest = process.env.NODE_ENV === 'test';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 0 : 200,    // 0 = illimité en test
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, veuillez réessayer dans 15 minutes.' },
});
app.use(globalLimiter);

// ── Sécurité : rate limiting strict sur l'authentification (anti-brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 0 : 10,     // 0 = illimité en test
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion, réessayez dans 15 minutes.' },
});

// ── Routes (MVC: routes → controllers → services → repositories)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tracker', trackerRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/emotions', emotionRoutes);
app.use('/api/users', userRoutes);

// ── Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'CESIZen API', version: '1.0.2' });
});

// ── 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
