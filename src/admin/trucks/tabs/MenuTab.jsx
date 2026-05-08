import React, { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import MenuItemForm from '../../../components/truck-form/MenuItemForm';
import MenuCsvImport from '../components/MenuCsvImport';
import { useMenuDragReorder } from '../../../components/truck-form/useMenuDragReorder';
import { Icons } from '../../../components/common/Icons';
import { useToast } from '../../../contexts/ToastContext';
import { useConfirm } from '../../../contexts/ConfirmContext';

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
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('truck_id', truck.id)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      setItems(data || []);
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
        const { error } = await supabase.from('menu_items').update(data).eq('id', editing.id);
        if (error) throw error;
        showToast('Menu item updated', 'success');
      } else {
        // Append to bottom: next display_order
        const next = (items[items.length - 1]?.display_order ?? -1) + 1;
        const { error } = await supabase.from('menu_items').insert([{ ...data, display_order: next }]);
        if (error) throw error;
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
      const { error } = await supabase.from('menu_items').delete().eq('id', item.id);
      if (error) throw error;
      showToast('Deleted', 'success');
      fetchItems();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const toggleAvailable = async (item) => {
    try {
      const { error } = await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id);
      if (error) throw error;
      fetchItems();
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  return (
    <div className="admin-tab-form">
      <div className="admin-tab-header">
        <h2>Menu</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => setShowImport(true)}>
            {Icons.upload || Icons.plus} Import CSV
          </button>
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            {Icons.plus} Add item
          </button>
        </div>
      </div>

      {items.length > 1 && (
        <p className="cell-sub">Drag the {Icons.menu || '☰'} handle to reorder. Order is saved instantly.</p>
      )}

      {loading ? (
        <div className="loading-state">{Icons.loader} Loading...</div>
      ) : items.length === 0 ? (
        <p className="cell-sub">No menu items yet.</p>
      ) : (
        <table className={`admin-trucks-table ${reordering ? 'is-reordering' : ''}`}>
          <thead>
            <tr>
              <th style={{ width: 28 }}></th>
              <th></th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Available</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr
                key={item.id}
                onDragOver={onDragOver}
                onDrop={onDrop(item.id)}
              >
                <td
                  className="drag-handle"
                  draggable
                  onDragStart={onDragStart(item.id)}
                  title="Drag to reorder"
                >
                  ⋮⋮
                </td>
                <td>
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="truck-thumb" />
                  ) : (
                    <span className="menu-item-emoji" style={{ fontSize: 24 }}>{item.emoji || '🍽️'}</span>
                  )}
                </td>
                <td>{item.name}</td>
                <td>{item.category || '—'}</td>
                <td>${parseFloat(item.price || 0).toFixed(2)}</td>
                <td>
                  <label className="toggle">
                    <input type="checkbox" checked={item.is_available !== false} onChange={() => toggleAvailable(item)} />
                    <span className="toggle-slider"></span>
                  </label>
                </td>
                <td>
                  <button className="btn-link" onClick={() => { setEditing(item); setShowForm(true); }}>Edit</button>
                  <button className="btn-link danger" onClick={() => handleDelete(item)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
