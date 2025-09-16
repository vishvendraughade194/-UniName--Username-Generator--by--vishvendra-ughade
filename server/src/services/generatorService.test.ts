import { describe, it, expect } from 'vitest';
import { generateUsernames } from './generatorService';

describe('generateUsernames', () => {
  it('returns at least one username for minimal input', () => {
    const out = generateUsernames({ name: 'Test User', birthDate: '', count: 5 });
    expect(out.length).toBeGreaterThan(0);
  });

  it('respects maxLength and filters', () => {
    const out = generateUsernames({ name: 'Alpha Beta', birthDate: '2000-01-02', word: 'gamma', count: 10, maxLength: 12, avoidUnderscore: true });
    expect(out.every(u => u.length <= 12)).toBe(true);
    expect(out.some(u => u.includes('_'))).toBe(false);
  });
});


