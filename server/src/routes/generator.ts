import { Router } from 'express';
import { z } from 'zod';
import { generateUsernames } from '../services/generatorService';

export const router = Router();

const inputSchema = z.object({
  name: z.string().min(1),
  birthDate: z.string().optional().default(''),
  word: z.string().optional().default(''),
  style: z.string().optional().default('smart'),
  count: z.number().int().min(1).max(20).optional().default(10),
  maxLength: z.number().int().min(3).max(24).optional().default(24),
  avoidNumbers: z.boolean().optional().default(false),
  avoidUnderscore: z.boolean().optional().default(false),
});

router.post('/generate', (req, res) => {
  try {
    const parsed = inputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    }
    const { name, birthDate, word, style, count, maxLength, avoidNumbers, avoidUnderscore } = parsed.data;
    if (!name && !word) {
      return res.status(400).json({ error: 'Provide at least a name or a word.' });
    }
    const usernames = generateUsernames({ name, birthDate, word, style, count, maxLength, avoidNumbers, avoidUnderscore });
    return res.json({ usernames });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /api/generate', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

router.get('/test', (_req, res) => {
  try {
    const usernames = generateUsernames({ name: 'Ayesha Khan', birthDate: '2001-06-15', word: 'galaxy', style: 'smart', count: 10, maxLength: 24 });
    return res.json({ usernames });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in /api/test', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


