import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { json } from 'express';
import { router as generatorRouter } from './routes/generator';
import { favoritesRouter } from './routes/favorites';
import { initDb } from './services/db';
import path from 'path';
import fs from 'fs';
import compression from 'compression';

const app = express();
const PORT = process.env.PORT || 3001;

// Use strong ETags for better client caching validation
app.set('etag', 'strong');

// Add request IDs
app.use((req, _res, next) => {
  (req as any).id = Math.random().toString(36).slice(2, 10);
  next();
});

// Lightweight logger: only log API routes (skip static/health) and reduce noise in production
app.use((req, res, next) => {
  const isApi = req.url.startsWith('/api/');
  const isHealth = req.url === '/api/health';
  const shouldLog = isApi && !isHealth && process.env.NODE_ENV !== 'test';
  if (!shouldLog) return next();
  const start = Date.now();
  console.log(`[API] ${req.method} ${req.url} id=${(req as any).id}`);
  res.on('finish', () => {
    console.log(`[API] ${req.method} ${req.url} id=${(req as any).id} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// Security headers
app.use(helmet());

// Tight CORS if ALLOWED_ORIGIN provided, else default
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin === '*' ? undefined : allowedOrigin }));
app.use(json({ limit: '256kb' }));
app.use(compression());

// Lightweight in-memory rate limiter: 100 requests / 30s per IP. Skip static and health.
type Window = { start: number; count: number };
const rateWindows: Map<string, Window> = new Map();
app.use((req, res, next) => {
  const isStatic = !req.url.startsWith('/api/');
  if (isStatic || req.url === '/api/health') return next();
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 30_000;
  const limit = 100;
  const w = rateWindows.get(ip) || { start: now, count: 0 };
  if (now - w.start > windowMs) {
    w.start = now; w.count = 0;
  }
  w.count += 1;
  rateWindows.set(ip, w);
  if (w.count > limit) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again shortly.' });
  }
  next();
});

// Resolve public directory for both dev (src) and prod (dist)
// In dev (__dirname => server/src), in prod (__dirname => server/dist)
const candidatePublic = path.join(__dirname, 'public');
// In Docker runtime, cwd is /app/server, so fallback should be ./src/public (not ./server/src/public)
const fallbackPublic = path.join(process.cwd(), 'src', 'public');
const publicDir = fs.existsSync(candidatePublic) ? candidatePublic : fallbackPublic;
app.use(express.static(publicDir, {
  etag: true,
  lastModified: true,
  maxAge: '7d',
  immutable: false,
  setHeaders: (res, filePath) => {
    // Do not cache HTML, cache other assets for a week
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
  }
}));

app.get('/api/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ status: 'ok' });
});

app.use('/api', generatorRouter);
app.use('/api', favoritesRouter);

app.get('*', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(publicDir, 'index.html'));
});

initDb().catch((e) => console.error('DB init error', e));

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  // Warm-up: pre-load NLP pipeline and keep instance hot by pinging itself
  try {
    fetch(`http://localhost:${PORT}/api/health`).catch(() => void 0);
  } catch {}
});


