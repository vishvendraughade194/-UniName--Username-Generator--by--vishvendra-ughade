import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../services/db';

export const favoritesRouter = Router();

const addSchema = z.object({
  name: z.string().min(1),
  birthDate: z.string().optional().default(''),
  word: z.string().optional().default(''),
  username: z.string().min(3).max(24),
});

favoritesRouter.post('/favorites', async (req, res) => {
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const db = getDb();
  if (!db) return res.status(503).json({ error: 'Database not configured' });
  const { name, birthDate, word, username } = parsed.data;
  await db.query('INSERT INTO favorites(name, birth_date, word, username) VALUES ($1,$2,$3,$4)', [name, birthDate, word, username]);
  res.json({ ok: true });
});

favoritesRouter.get('/favorites', async (_req, res) => {
  const db = getDb();
  if (!db) return res.status(503).json({ error: 'Database not configured' });
  const result = await db.query('SELECT id, name, birth_date as "birthDate", word, username, created_at as "createdAt" FROM favorites ORDER BY id DESC LIMIT 100');
  res.json({ favorites: result.rows });
});


