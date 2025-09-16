import express from 'express';
import cors from 'cors';
import { json } from 'express';
import { router as generatorRouter } from './routes/generator';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3001;

// Basic logger
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[REQ] ${req.method} ${req.url}`);
  res.on('finish', () => {
    console.log(`[RES] ${req.method} ${req.url} ${Date.now() - start}ms`);
  });
  next();
});

app.use(cors());
app.use(json({ limit: '256kb' }));

// Simple in-memory rate limiter: 60 req/min/IP
const requestsPerIp: Map<string, number[]> = new Map();
app.use((req, res, next) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60_000;
  const limit = 60;
  const arr = requestsPerIp.get(ip) || [];
  const recent = arr.filter((t) => now - t < windowMs);
  recent.push(now);
  requestsPerIp.set(ip, recent);
  if (recent.length > limit) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again shortly.' });
  }
  next();
});

// Resolve public directory for both dev (ts-node) and prod (dist)
const cwd = process.cwd();
const distPublic = path.join(cwd, 'server', 'dist', 'public');
const srcPublic = path.join(cwd, 'server', 'src', 'public');
const publicDir = fs.existsSync(distPublic) ? distPublic : srcPublic;
app.use(express.static(publicDir));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', generatorRouter);

app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


