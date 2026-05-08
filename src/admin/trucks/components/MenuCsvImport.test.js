import { describe, it, expect } from 'vitest';
import { parseCsv } from './MenuCsvImport';

describe('parseCsv', () => {
  it('returns empty for empty input', () => {
    expect(parseCsv('')).toEqual({ headers: [], rows: [] });
    expect(parseCsv('\n')).toEqual({ headers: [], rows: [] });
  });

  it('parses a simple header + rows', () => {
    const result = parseCsv('name,price\nTaco,4.50\nBurrito,9.00');
    expect(result.headers).toEqual(['name', 'price']);
    expect(result.rows).toEqual([
      { name: 'Taco', price: '4.50' },
      { name: 'Burrito', price: '9.00' },
    ]);
  });

  it('lowercases headers', () => {
    const { headers } = parseCsv('Name,Price\nx,1');
    expect(headers).toEqual(['name', 'price']);
  });

  it('handles quoted fields with commas inside', () => {
    const { rows } = parseCsv('name,description\nTaco,"crispy, salty"');
    expect(rows[0].description).toBe('crispy, salty');
  });

  it('handles escaped double quotes inside quoted fields', () => {
    const { rows } = parseCsv('name\n"foo ""bar"" baz"');
    expect(rows[0].name).toBe('foo "bar" baz');
  });

  it('strips a UTF-8 BOM', () => {
    const { headers } = parseCsv('﻿name,price\n');
    expect(headers).toEqual(['name', 'price']);
  });

  it('strips carriage returns (Windows line endings)', () => {
    const { rows } = parseCsv('name,price\r\nTaco,4.50\r\n');
    expect(rows).toEqual([{ name: 'Taco', price: '4.50' }]);
  });

  it('skips blank lines', () => {
    const { rows } = parseCsv('name\n\n\nTaco\n');
    expect(rows).toEqual([{ name: 'Taco' }]);
  });

  it('fills missing trailing columns with empty string', () => {
    const { rows } = parseCsv('name,category,emoji\nTaco,,🌮');
    expect(rows[0]).toEqual({ name: 'Taco', category: '', emoji: '🌮' });
  });
});
