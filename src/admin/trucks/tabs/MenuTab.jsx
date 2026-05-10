import React, { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  fetchMenuItemsRaw,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  setMenuItemAvailability,
} from '../../../services/menu';
import MenuItemForm from '../../../components/truck-form/MenuItemForm';
import MenuCsvImport from '../components/MenuCsvImport';
import { useMenuDragReorder } from '../../../components/truck-form/useMenuDragReorder';
import { Icons } from '../../../components/common/Icons';
import { useToast } from '../../../contexts/ToastContext';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSplash from '../../../components/common/LoadingSplash';
import { cn } from '@/lib/utils';

const MenuTab = () => {
  const { truck } = useOutletContext();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const { reordering, onDragStart, onDragOver, onDrop } = useMenuDragReorder(items, setItems, {
    onSuccess: () => showToast('Order saved', 'success'),
    onError: (err) => {
      console.error(err);
      showToast(err.message || 'Reorder failed', 'error');
      fetchItems();
    },
  });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchMenuItemsRaw(truck.id));
    } catch (err) {
      console.error(err);
      showToast('Failed to load menu', 'error');
    } finally {
      setLoading(false);
    }
  }, [truck.id, showToast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const close = () => { setShowForm(false); setEditing(null); };

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await updateMenuItem(editing.id, data);
        showToast('Menu item updated', 'success');
      } else {
        const next = (items[items.length - 1]?.display_order ?? -1) + 1;
        await createMenuItem({ ...data, display_order: next });
        showToast('Menu item added', 'success');
      }
      close();
      fetchItems();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const ok = await confirm({
      title: 'Delete menu item',
      message: `Delete "${item.name}"? This cannot be undone.`,
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteMenuItem(item.id);
      showToast('Deleted', 'success');
      fetchItems();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const toggleAvailable = async (item) => {
    try {
      await setMenuItemAvailability(item.id, !item.is_available);
      fetchItems();
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold tracking-tight">Menu</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImport(true)}
            className="gap-1.5"
          >
            <span className="h-4 w-4">{Icons.upload || Icons.plus}</span>
            Import CSV
          </Button>
          <Button
            size="sm"
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="gap-1.5"
          >
            <span className="h-4 w-4">{Icons.plus}</span>
            Add item
          </Button>
        </div>
      </div>

      {items.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Drag the ⋮⋮ handle to reorder. Order is saved instantly.
        </p>
      )}

      {loading ? (
        <LoadingSplash size="inline" tagline="LOADING MENU" />
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            No menu items yet.
          </CardContent>
        </Card>
      ) : (
        <Card className={cn('overflow-hidden transition-opacity', reordering && 'opacity-60')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="w-10"></th>
                  <th className="w-14"></th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Available</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map(item => (
                  <tr
                    key={item.id}
                    onDragOver={onDragOver}
                    onDrop={onDrop(item.id)}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td
                      draggable
                      onDragStart={onDragStart(item.id)}
                      title="Drag to reorder"
                      className="cursor-grab select-none text-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
                    >
                      ⋮⋮
                    </td>
                    <td className="px-3 py-2">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt=""
                          className="h-10 w-10 rounded-md object-cover ring-1 ring-black/5"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-xl">
                          {item.emoji || '🍽️'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {item.category || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums">
                      ${parseFloat(item.price || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.is_available !== false}
                        onClick={() => toggleAvailable(item)}
                        className={cn(
                          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
                          item.is_available !== false ? 'bg-positive' : 'bg-muted'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                            item.is_available !== false ? 'translate-x-[18px]' : 'translate-x-0.5'
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditing(item); setShowForm(true); }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showForm && (
        <MenuItemForm
          initialItem={editing}
          truckId={truck.id}
          onSubmit={handleSubmit}
          onCancel={close}
          saving={saving}
        />
      )}

      {showImport && (
        <MenuCsvImport
          truckId={truck.id}
          existingItems={items}
          onClose={() => setShowImport(false)}
          onImported={fetchItems}
        />
      )}
    </div>
  );
};

export default MenuTab;
