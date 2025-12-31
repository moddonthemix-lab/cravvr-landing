import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const MenuManagement = ({ truckId, truckName, onBack }) => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Main'
  });

  const supabase = window.supabaseClient;

  useEffect(() => {
    loadMenuItems();
  }, [truckId]);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('food_truck_menus')
        .select('*')
        .eq('food_truck_id', truckId)
        .order('category', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase
        .from('food_truck_menus')
        .insert({
          food_truck_id: truckId,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category
        })
        .select()
        .single();

      if (error) throw error;

      setMenuItems([...menuItems, data]);
      setFormData({ name: '', description: '', price: '', category: 'Main' });
      setIsAdding(false);
      alert('Menu item added successfully!');
    } catch (error) {
      console.error('Error adding menu item:', error);
      alert('Failed to add menu item');
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase
        .from('food_truck_menus')
        .update({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category
        })
        .eq('id', editingItem.id)
        .select()
        .single();

      if (error) throw error;

      setMenuItems(menuItems.map(item =>
        item.id === editingItem.id ? data : item
      ));
      setFormData({ name: '', description: '', price: '', category: 'Main' });
      setEditingItem(null);
      alert('Menu item updated successfully!');
    } catch (error) {
      console.error('Error updating menu item:', error);
      alert('Failed to update menu item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('food_truck_menus')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setMenuItems(menuItems.filter(item => item.id !== itemId));
      alert('Menu item deleted successfully!');
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert('Failed to delete menu item');
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category
    });
    setIsAdding(false);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingItem(null);
    setFormData({ name: '', description: '', price: '', category: 'Main' });
  };

  const categories = ['Main', 'Side', 'Drink', 'Dessert', 'Special'];

  // Group items by category
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading menu...</p>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '30px',
        gap: '15px'
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '5px'
          }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
            Menu Management
          </h1>
          <p style={{ color: '#666', margin: 0 }}>{truckName}</p>
        </div>
        {!isAdding && !editingItem && (
          <button
            onClick={() => setIsAdding(true)}
            style={{
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            + Add Item
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingItem) && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
            {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>

          <form onSubmit={editingItem ? handleUpdateItem : handleAddItem}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#374151'
              }}>
                Item Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Korean BBQ Bowl"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#374151'
              }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the item..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  placeholder="12.99"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white'
                  }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Menu Items */}
      {menuItems.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '60px 30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center',
          color: '#9ca3af'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🍽️</div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>
            No menu items yet
          </h3>
          <p style={{ marginBottom: '20px' }}>Start building your menu by adding your first item!</p>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              style={{
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              + Add First Item
            </button>
          )}
        </div>
      ) : (
        <div>
          {categories.map(category => {
            const items = groupedItems[category];
            if (!items || items.length === 0) return null;

            return (
              <div key={category} style={{ marginBottom: '30px' }}>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  marginBottom: '15px',
                  color: '#374151'
                }}>
                  {category}
                </h2>

                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '20px 0',
                        borderBottom: index < items.length - 1 ? '1px solid #e5e7eb' : 'none'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            marginBottom: '4px',
                            color: '#111827'
                          }}>
                            {item.name}
                          </h3>
                          {item.description && (
                            <p style={{
                              fontSize: '14px',
                              color: '#6b7280',
                              marginBottom: '8px'
                            }}>
                              {item.description}
                            </p>
                          )}
                          <p style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#8b5cf6'
                          }}>
                            ${item.price.toFixed(2)}
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
                          <button
                            onClick={() => startEdit(item)}
                            style={{
                              padding: '8px 16px',
                              background: '#f3f4f6',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              color: '#374151'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            style={{
                              padding: '8px 16px',
                              background: '#fee2e2',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              color: '#dc2626'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
