import React, { useState } from 'react';
import ImageUpload from '../common/ImageUpload';
import { Icons } from '../common/Icons';

const DEFAULT_FORM = {
  name: '',
  price: '',
  category: '',
  description: '',
  emoji: '',
  image_url: '',
};

const MenuItemForm = ({ initialItem, truckId, onSubmit, onCancel, saving }) => {
  const [formData, setFormData] = useState(() => ({
    name: initialItem?.name || '',
    price: initialItem?.price ?? '',
    category: initialItem?.category || '',
    description: initialItem?.description || '',
    emoji: initialItem?.emoji || '',
    image_url: initialItem?.image_url || '',
  }));

  const isEditing = !!initialItem?.id;

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      price: parseFloat(formData.price),
      truck_id: truckId,
    };
    onSubmit(data);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
          <button className="close-btn" onClick={onCancel} type="button">
            {Icons.x}
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Item Name</label>
            <input
              type="text"
              placeholder="Enter item name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select category</option>
                <option value="Appetizers">Appetizers</option>
                <option value="Mains">Mains</option>
                <option value="Tacos">Tacos</option>
                <option value="Burritos">Burritos</option>
                <option value="Bowls">Bowls</option>
                <option value="Sides">Sides</option>
                <option value="Desserts">Desserts</option>
                <option value="Drinks">Drinks</option>
                <option value="Specials">Specials</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Describe this item..."
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <ImageUpload
            label="Item Photo (optional)"
            currentImage={formData.image_url}
            onUpload={(url) => setFormData({ ...formData, image_url: url })}
            bucket="images"
            folder={truckId ? `menu-items/${truckId}` : 'menu-items/temp'}
            disabled={saving}
          />
          <div className="form-group" style={{ maxWidth: '120px' }}>
            <label>Emoji (fallback if no photo)</label>
            <input
              type="text"
              placeholder="🌮"
              value={formData.emoji}
              onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
              maxLength={4}
              style={{ textAlign: 'center', fontSize: '1.5rem' }}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuItemForm;

export { DEFAULT_FORM as DEFAULT_MENU_ITEM };
