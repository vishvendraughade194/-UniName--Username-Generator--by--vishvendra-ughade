import { Router } from 'express';
import { z } from 'zod';
import { generateUsernames } from '../services/generatorService';

export const router = Router();

const inputSchema = z.object({
  name: z.string().min(1),
  birthDate: z.string().min(1),
  word: z.string().optional().default(''),
  style: z.string().optional().default('smart'),
  count: z.number().int().min(1).max(20).optional().default(10),
  maxLength: z.number().int().min(3).max(24).optional().default(24),
  avoidNumbers: z.boolean().optional().default(false),
  avoidUnderscore: z.boolean().optional().default(false),
});

router.post('/generate', (req, res) => {
  const parsed = inputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }
  const { name, birthDate, word, style, count, maxLength, avoidNumbers, avoidUnderscore } = parsed.data;
  const usernames = generateUsernames({ name, birthDate, word, style, count, maxLength, avoidNumbers, avoidUnderscore });
  res.json({ usernames });
});


