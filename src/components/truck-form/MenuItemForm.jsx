import React, { useState } from 'react';
import ImageUpload from '../common/ImageUpload';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const DEFAULT_FORM = {
  name: '',
  price: '',
  category: '',
  description: '',
  emoji: '',
  image_url: '',
};

const CATEGORY_OPTIONS = [
  'Appetizers',
  'Mains',
  'Tacos',
  'Burritos',
  'Bowls',
  'Sides',
  'Desserts',
  'Drinks',
  'Specials',
];

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

  const handleOpenChange = (open) => {
    if (!open && !saving) onCancel();
  };

  const previewPrice =
    formData.price !== '' && !Number.isNaN(parseFloat(formData.price))
      ? `$${parseFloat(formData.price).toFixed(2)}`
      : '$0.00';

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">
            {isEditing ? 'Edit menu item' : 'Add menu item'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details, photo, and category for this item.'
              : 'Add a new dish to your menu. Photos help orders convert better.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-6 py-5 space-y-6">
            <div className="rounded-xl border bg-muted/30 p-3 flex items-center gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-black/5">
                {formData.image_url ? (
                  <img
                    src={formData.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : formData.emoji ? (
                  <div className="flex h-full w-full items-center justify-center text-3xl">
                    {formData.emoji}
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                    Preview
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate">
                  {formData.name || 'Untitled item'}
                </p>
                <p className="text-xs text-muted-foreground capitalize truncate">
                  {formData.category || 'No category'}
                </p>
              </div>
              <span className="text-base font-bold tabular-nums shrink-0">
                {previewPrice}
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="menu-item-name">Item name</Label>
              <Input
                id="menu-item-name"
                type="text"
                placeholder="e.g. Carne asada taco"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="menu-item-price">Price</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="menu-item-price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="pl-7 tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="menu-item-category">Category</Label>
                <select
                  id="menu-item-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select category</option>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="menu-item-description">Description</Label>
              <Textarea
                id="menu-item-description"
                placeholder="Describe the dish — ingredients, prep style, anything that makes it crave-worthy."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Photo</Label>
              <ImageUpload
                currentImage={formData.image_url}
                onUpload={(url) => setFormData({ ...formData, image_url: url })}
                bucket="images"
                folder={truckId ? `menu-items/${truckId}` : 'menu-items/temp'}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="menu-item-emoji">Emoji fallback</Label>
              <p className="text-xs text-muted-foreground">
                Shown when there is no photo. Use a single emoji.
              </p>
              <Input
                id="menu-item-emoji"
                type="text"
                placeholder="🌮"
                value={formData.emoji}
                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                maxLength={4}
                className="w-20 text-center text-2xl"
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/20 sm:space-x-0 gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MenuItemForm;

export { DEFAULT_FORM as DEFAULT_MENU_ITEM };
