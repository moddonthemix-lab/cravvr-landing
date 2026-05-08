import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * Pure helper: given the current array, move the item with id=fromId to the
 * position currently held by id=overId. Returns a new array; or the original
 * if either id is missing or both are equal.
 */
export function reorderById(items, fromId, overId) {
  if (!fromId || fromId === overId) return items;
  const from = items.findIndex(i => i.id === fromId);
  const to = items.findIndex(i => i.id === overId);
  if (from === -1 || to === -1) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * Pure helper: given the original array and a candidate next array, return
 * just the rows whose `display_order` should change. Indexed by id.
 */
export function diffDisplayOrder(original, next) {
  return next
    .map((item, idx) => ({ id: item.id, display_order: idx }))
    .filter(u => {
      const orig = original.find(i => i.id === u.id);
      return orig && orig.display_order !== u.display_order;
    });
}

/**
 * HTML5 drag-and-drop reorder hook for menu_items rows.
 * Caller renders a drag handle per row, wires the event handlers, and
 * exposes its current ordered list. The hook diff-updates `display_order`
 * for the items whose position changed.
 *
 *   const { onDragStart, onDragOver, onDrop, reordering } =
 *     useMenuDragReorder(items, setItems, { onError, onSuccess });
 */
export function useMenuDragReorder(items, setItems, { onError, onSuccess } = {}) {
  const [reordering, setReordering] = useState(false);
  const dragIdRef = useRef(null);

  const persistOrder = async (next) => {
    setReordering(true);
    try {
      const updates = diffDisplayOrder(items, next);
      if (updates.length === 0) return;
      const results = await Promise.all(
        updates.map(u =>
          supabase.from('menu_items').update({ display_order: u.display_order }).eq('id', u.id)
        )
      );
      const firstErr = results.find(r => r.error);
      if (firstErr) throw firstErr.error;
      onSuccess?.();
    } catch (err) {
      onError?.(err);
    } finally {
      setReordering(false);
    }
  };

  const onDragStart = (id) => (e) => {
    dragIdRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (overId) => (e) => {
    e.preventDefault();
    const fromId = dragIdRef.current;
    dragIdRef.current = null;
    const next = reorderById(items, fromId, overId);
    if (next === items) return;
    setItems(next);
    persistOrder(next);
  };

  return { reordering, onDragStart, onDragOver, onDrop };
}
