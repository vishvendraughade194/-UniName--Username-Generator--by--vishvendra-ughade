import { describe, it, expect } from 'vitest';
import { generateUsernames } from './generatorService';

describe('generateUsernames', () => {
  it('returns at least one username for basic input', () => {
    const out = generateUsernames({ name: 'Ayesha Khan', birthDate: '2001-06-15', word: 'galaxy', count: 10 });
    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBeGreaterThan(0);
  });

  it('respects maxLength', () => {
    const out = generateUsernames({ name: 'Test User', birthDate: '1999-01-01', word: 'alpha', count: 10, maxLength: 8 });
    expect(out.every(u => u.length <= 8)).toBe(true);
  });

  it('avoids numbers and underscores when requested', () => {
    const out = generateUsernames({ name: 'Beta User', birthDate: '1999-01-01', word: 'beta', count: 10, avoidNumbers: true, avoidUnderscore: true });
    expect(out.every(u => !/[0-9_]/.test(u))).toBe(true);
  });

  it('returns at least one username for minimal input', () => {
    const out = generateUsernames({ name: 'Test User', birthDate: '', count: 5 });
    expect(out.length).toBeGreaterThan(0);
  });

  it('respects maxLength and filters (no underscore)', () => {
    const out = generateUsernames({ name: 'Alpha Beta', birthDate: '2000-01-02', word: 'gamma', count: 10, maxLength: 12, avoidUnderscore: true });
    expect(out.every(u => u.length <= 12)).toBe(true);
    expect(out.some(u => u.includes('_'))).toBe(false);
  });
});


