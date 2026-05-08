import { describe, it, expect } from 'vitest';
import { truckPath } from './trucks';

describe('truckPath', () => {
  it('falls back to /truck/:id when no slug present', () => {
    expect(truckPath({ id: 'abc-123' })).toBe('/truck/abc-123');
  });

  it('uses /t/:slug when slug present at top level', () => {
    expect(truckPath({ id: 'abc-123', slug: 'tasty-tacos' })).toBe('/t/tasty-tacos');
  });

  it('uses /t/:slug when slug only on _raw', () => {
    expect(truckPath({ id: 'abc-123', _raw: { slug: 'tasty-tacos' } })).toBe('/t/tasty-tacos');
  });

  it('returns home for nullish input', () => {
    expect(truckPath(null)).toBe('/');
    expect(truckPath(undefined)).toBe('/');
  });
});
