import { describe, it, expect } from 'vitest';
import { reorderById, diffDisplayOrder } from './useMenuDragReorder';

const items = [
  { id: 'a', display_order: 0 },
  { id: 'b', display_order: 1 },
  { id: 'c', display_order: 2 },
];

describe('reorderById', () => {
  it('moves first to last', () => {
    expect(reorderById(items, 'a', 'c').map(i => i.id)).toEqual(['b', 'c', 'a']);
  });

  it('moves last to first', () => {
    expect(reorderById(items, 'c', 'a').map(i => i.id)).toEqual(['c', 'a', 'b']);
  });

  it('moves middle to end', () => {
    expect(reorderById(items, 'b', 'c').map(i => i.id)).toEqual(['a', 'c', 'b']);
  });

  it('returns the same array reference when fromId is empty', () => {
    expect(reorderById(items, null, 'a')).toBe(items);
  });

  it('returns the same array reference when fromId === overId', () => {
    expect(reorderById(items, 'a', 'a')).toBe(items);
  });

  it('returns the same array when an id is unknown', () => {
    expect(reorderById(items, 'a', 'zzz')).toBe(items);
    expect(reorderById(items, 'zzz', 'a')).toBe(items);
  });
});

describe('diffDisplayOrder', () => {
  it('returns updates only for moved items', () => {
    const next = reorderById(items, 'a', 'c'); // [b, c, a]
    expect(diffDisplayOrder(items, next)).toEqual([
      { id: 'b', display_order: 0 },
      { id: 'c', display_order: 1 },
      { id: 'a', display_order: 2 },
    ]);
  });

  it('returns no updates when nothing moved', () => {
    expect(diffDisplayOrder(items, items)).toEqual([]);
  });

  it('skips ids not in original', () => {
    const next = [...items, { id: 'd', display_order: 0 }];
    const diff = diffDisplayOrder(items, next);
    expect(diff.find(u => u.id === 'd')).toBeUndefined();
  });
});
