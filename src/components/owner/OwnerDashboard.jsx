import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  fetchOwnerTrucksWithStats,
  setTruckAcceptingOrders,
  updateTruckQueueSettings,
  createOwnerTruck,
  deleteOwnerTruck,
  updateTruck as updateTruckService,
  fetchOwnerFirstTruckQueueSettings,
} from '../../services/trucks';
import { fetchOwnerSelf, updateOwnerSelf } from '../../services/owners';
import { fetchOwnerOrders, fetchOwnerOrderById } from '../../services/orders';
import {
  fetchMenuItemsRaw,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../../services/menu';
import ImageUpload from '../common/ImageUpload';
import { uploadTruckImage, uploadMenuItemImage } from '../../lib/storage';
import { Icons } from '../common/Icons';
import { formatRelativeTime } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import MenuItemForm from '../truck-form/MenuItemForm';
import { useMenuDragReorder } from '../truck-form/useMenuDragReorder';
import MenuCsvImport from '../../admin/trucks/components/MenuCsvImport';
import KitchenDisplay from './KitchenDisplay';
import StripeOnboarding from './StripeOnboarding';
import PaymentProcessorSetup from './PaymentProcessorSetup';
import PaymentsDashboard from './PaymentsDashboard';
import CravvrPlusBilling from './CravvrPlusBilling';
import { useCravvrSubscription } from '../../hooks/useCravvrSubscription';
import TruckEditDialog from './TruckEditDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BarChart, BarList } from '@tremor/react';
import { cn } from '@/lib/utils';
import LoadingSplash from '../common/LoadingSplash';
import './OwnerDashboard.css';
import './StripeOnboarding.css';

// Maps order status (including the synthesized 'abandoned' status) to a Badge variant.
const ORDER_STATUS_BADGE = {
  new: 'info',
  pending: 'info',
  confirmed: 'info',
  preparing: 'warning',
  ready: 'positive',
  completed: 'secondary',
  cancelled: 'destructive',
  rejected: 'destructive',
  abandoned: 'outline',
};

const ORDER_STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
  abandoned: 'Abandoned Cart',
};

const QUICK_ACTIONS = [
  { key: 'trucks', label: 'Add New Truck', iconKey: 'plus', tone: 'positive' },
  { key: 'menu', label: 'Update Menu', iconKey: 'edit', tone: 'warning' },
  { key: 'analytics', label: 'View Reports', iconKey: 'chart', tone: 'info' },
];

// Tailwind chip color classes per accent tone. Defined as full strings so
// Tailwind's content scanner picks them up at build time.
const TONE_CHIP = {
  positive: 'bg-positive/10 text-positive',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
};

// Overview Tab
const OverviewTab = ({ setActiveTab, trucks, orders, stats }) => {
  const recentOrders = orders.slice(0, 3);

  return (
    <div className="tab-content">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back!</h1>
        <p className="text-sm text-muted-foreground">
          Here's what's happening with your trucks today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-5 flex items-center gap-4">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-lg shrink-0"
                style={{ background: `${stat.color}15`, color: stat.color }}
              >
                {stat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold tracking-tight leading-tight">{stat.value}</div>
                <div className="text-sm text-muted-foreground truncate">{stat.label}</div>
              </div>
              {stat.change && <Badge variant="positive">{stat.change}</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Orders</CardTitle>
            <button
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => setActiveTab('orders')}
            >
              View All
            </button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No orders yet</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentOrders.map(order => {
                  const isAbandoned =
                    order.status === 'cancelled' && order.payment_status === 'failed';
                  const displayStatus = isAbandoned ? 'abandoned' : order.status;
                  const displayLabel = isAbandoned ? 'abandoned cart' : order.status;
                  return (
                    <li key={order.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm">{order.order_number}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {order.customer_name || 'Customer'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-semibold text-sm tabular-nums">
                          ${parseFloat(order.total).toFixed(2)}
                        </span>
                        <Badge variant={ORDER_STATUS_BADGE[displayStatus] || 'secondary'}>
                          {displayLabel}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.key}
                  onClick={() => setActiveTab(action.key)}
                  className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-muted hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${TONE_CHIP[action.tone]}`}
                  >
                    {Icons[action.iconKey]}
                  </span>
                  <span className="flex-1 font-medium text-sm">{action.label}</span>
                  <span className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5">
                    {Icons.chevronRight}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>My Trucks</CardTitle>
          <button
            className="text-sm font-medium text-primary hover:underline"
            onClick={() => setActiveTab('trucks')}
          >
            Manage
          </button>
        </CardHeader>
        <CardContent>
          {trucks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No trucks yet. Add your first truck to get started!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trucks.map(truck => (
                <div
                  key={truck.id}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3"
                >
                  <img
                    src={
                      truck.image_url ||
                      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={truck.name}
                    className="h-14 w-14 rounded-md object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{truck.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">{truck.cuisine}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-3 w-3 shrink-0 text-warning">{Icons.star}</span>
                        {truck.average_rating || 'N/A'}
                      </span>
                      <span>{truck.today_orders || 0} today</span>
                    </div>
                  </div>
                  <Badge variant={truck.is_open ? 'positive' : 'secondary'}>
                    {truck.is_open ? 'Open' : 'Closed'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Trucks Management Tab
const TrucksTab = ({ trucks, setTrucks, onTruckCreate, onTruckUpdate, onTruckDelete, loading }) => {
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);

  const openAddForm = () => {
    setEditingTruck(null);
    setShowForm(true);
  };
  const openEditForm = (truck) => {
    setEditingTruck(truck);
    setShowForm(true);
  };

  const handleDelete = async (truckId) => {
    const confirmed = await confirm({
      title: 'Delete Truck',
      message: 'Are you sure you want to delete this truck? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await onTruckDelete(truckId);
    } catch (err) {
      console.error('Failed to delete truck:', err);
      showToast('Failed to delete truck. Please try again.', 'error');
    }
  };

  return (
    <div className="tab-content">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Trucks</h1>
          <p className="text-sm text-muted-foreground">
            Manage your food trucks and their details.
          </p>
        </div>
        <Button onClick={openAddForm} className="gap-2">
          <span className="h-4 w-4 shrink-0">{Icons.plus}</span>
          Add Truck
        </Button>
      </div>

      <TruckEditDialog
        open={showForm}
        onOpenChange={setShowForm}
        truck={editingTruck}
        onCreate={onTruckCreate}
        onUpdate={onTruckUpdate}
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
          Loading trucks...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {trucks.map(truck => {
            const accepting = truck.accepting_orders !== false;
            return (
              <Card key={truck.id} className="overflow-hidden flex flex-col">
                <div className="relative aspect-[16/9] bg-muted">
                  <img
                    src={
                      truck.image_url ||
                      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={truck.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <Badge
                    variant={truck.is_open ? 'positive' : 'secondary'}
                    className="absolute top-3 right-3 shadow-sm"
                  >
                    {truck.is_open ? 'Open' : 'Closed'}
                  </Badge>
                </div>

                <CardContent className="flex flex-col gap-3 p-5 flex-1">
                  <div>
                    <h3 className="font-semibold text-base leading-tight">{truck.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {truck.cuisine}
                      {truck.estimated_prep_time && ` • ${truck.estimated_prep_time}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <span className="h-4 w-4 shrink-0 text-warning">{Icons.star}</span>
                    <span className="font-medium text-foreground">
                      {truck.average_rating || 'N/A'}
                    </span>
                    <span>({truck.review_count || 0} reviews)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3">
                    <div className="flex flex-col">
                      <span className="text-base font-bold tabular-nums">
                        {truck.total_orders || 0}
                      </span>
                      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Total Orders
                      </span>
                    </div>
                    <div className="flex flex-col border-l border-border pl-2">
                      <span className="text-base font-bold tabular-nums">
                        ${truck.total_revenue?.toFixed(2) || '0.00'}
                      </span>
                      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Revenue
                      </span>
                    </div>
                    <div className="flex flex-col border-l border-border pl-2">
                      <span className="text-base font-bold tabular-nums text-positive">
                        ${truck.today_revenue?.toFixed(2) || '0.00'}
                      </span>
                      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Today
                      </span>
                    </div>
                  </div>

                  <Button
                    variant={accepting ? 'secondary' : 'outline'}
                    size="sm"
                    className={`w-full justify-center ${accepting ? 'bg-positive/10 text-positive hover:bg-positive/15' : 'bg-warning/10 text-warning hover:bg-warning/15 border-warning/20'}`}
                    onClick={async () => {
                      const newValue = !accepting;
                      await setTruckAcceptingOrders(truck.id, newValue);
                      setTrucks(prev =>
                        prev.map(t =>
                          t.id === truck.id ? { ...t, accepting_orders: newValue } : t
                        )
                      );
                    }}
                  >
                    {accepting ? '\u2713 Accepting Orders' : '\u23F8 Orders Paused'}
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => openEditForm(truck)}
                    >
                      <span className="h-4 w-4 shrink-0">{Icons.edit}</span>
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(truck.id)}
                    >
                      <span className="h-4 w-4 shrink-0">{Icons.trash}</span>
                      Delete
                    </Button>
                  </div>
                </CardContent>

                <div className="border-t bg-muted/30 px-5 py-3">
                  <PaymentProcessorSetup
                    truck={truck}
                    onUpdate={() => onTruckUpdate && onTruckUpdate(truck.id, {})}
                  />
                </div>
              </Card>
            );
          })}

          <button
            type="button"
            onClick={openAddForm}
            className="group flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card/50 p-6 text-muted-foreground transition-colors hover:border-primary hover:text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary/10">
              {Icons.plus}
            </span>
            <span className="font-medium">Add New Truck</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Menu Management Tab
const MenuTab = ({ menuItems, setMenuItems, refetchMenu, trucks, selectedTruckId, onTruckSelect, onMenuItemCreate, onMenuItemUpdate, onMenuItemDelete, loading }) => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { reordering, onDragStart, onDragOver, onDrop } = useMenuDragReorder(menuItems, setMenuItems, {
    onSuccess: () => showToast('Order saved', 'success'),
    onError: (err) => {
      console.error(err);
      showToast(err.message || 'Reorder failed', 'error');
      refetchMenu?.();
    },
  });

  const categoriesRaw = [...new Set(menuItems.filter(item => item.category).map(item => item.category))];
  const categories = ['all', ...categoriesRaw];

  const itemsByCategory = activeCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? itemsByCategory.filter(item =>
        item.name?.toLowerCase().includes(normalizedQuery) ||
        item.description?.toLowerCase().includes(normalizedQuery) ||
        item.category?.toLowerCase().includes(normalizedQuery))
    : itemsByCategory;
  const dragEnabled = activeCategory === 'all' && !normalizedQuery;

  const totalCount = menuItems.length;
  const availableCount = menuItems.filter(i => i.is_available).length;
  const unavailableCount = totalCount - availableCount;
  const categoryCount = categoriesRaw.length;

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSave = async (data) => {
    if (!selectedTruckId) {
      showToast('Please select a truck first', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        await onMenuItemUpdate(editingItem.id, data);
      } else {
        await onMenuItemCreate(data);
      }
      closeForm();
    } catch (err) {
      console.error('Failed to save menu item:', err);
      showToast('Failed to save menu item. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId) => {
    const confirmed = await confirm({
      title: 'Delete Menu Item',
      message: 'Are you sure you want to delete this menu item?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await onMenuItemDelete(itemId);
    } catch (err) {
      console.error('Failed to delete menu item:', err);
      showToast('Failed to delete menu item. Please try again.', 'error');
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await onMenuItemUpdate(item.id, { is_available: !item.is_available });
    } catch (err) {
      console.error('Failed to update availability:', err);
      showToast('Failed to update item availability.', 'error');
    }
  };

  const stats = [
    { label: 'Total items', value: totalCount, tone: 'info', iconKey: 'menu' },
    { label: 'Available', value: availableCount, tone: 'positive', iconKey: 'check' },
    { label: 'Unavailable', value: unavailableCount, tone: 'warning', iconKey: 'alertCircle' },
    { label: 'Categories', value: categoryCount, tone: 'info', iconKey: 'filter' },
  ];

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      {trucks.length > 0 && (
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          value={selectedTruckId || ''}
          onChange={(e) => onTruckSelect(e.target.value)}
        >
          <option value="">Select a truck</option>
          {trucks.map(truck => (
            <option key={truck.id} value={truck.id}>{truck.name}</option>
          ))}
        </select>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowImport(true)}
        disabled={!selectedTruckId}
        className="gap-1.5"
      >
        <span className="h-4 w-4">{Icons.plus}</span>
        Import CSV
      </Button>
      <Button
        size="sm"
        onClick={() => { setEditingItem(null); setShowForm(true); }}
        disabled={!selectedTruckId}
        className="gap-1.5"
      >
        <span className="h-4 w-4">{Icons.plus}</span>
        Add Item
      </Button>
    </div>
  );

  return (
    <div className="tab-content">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-sm text-muted-foreground">Add, edit, and manage your menu items.</p>
        </div>
        {headerActions}
      </div>

      {!selectedTruckId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <span className="h-5 w-5">{Icons.menu}</span>
            </div>
            <h3 className="text-base font-semibold">Select a truck</h3>
            <p className="mt-1 text-sm text-muted-foreground">Choose a truck above to manage its menu.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {stats.map(stat => (
              <Card key={stat.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', TONE_CHIP[stat.tone])}>
                    <span className="h-4 w-4">{Icons[stat.iconKey] || Icons.menu}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl font-bold tracking-tight leading-tight tabular-nums">{stat.value}</div>
                    <div className="text-xs text-muted-foreground truncate">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-3 mb-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xs">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
                {Icons.search}
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items, descriptions, categories…"
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>

            {categories.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {categories.map(cat => {
                  const isActive = activeCategory === cat;
                  const count = cat === 'all' ? totalCount : menuItems.filter(i => i.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      {cat === 'all' ? 'All items' : cat}
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
                          isActive ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {showForm && (
            <MenuItemForm
              initialItem={editingItem}
              truckId={selectedTruckId}
              onSubmit={handleSave}
              onCancel={closeForm}
              saving={saving}
            />
          )}

          {showImport && (
            <MenuCsvImport
              truckId={selectedTruckId}
              existingItems={menuItems}
              onClose={() => setShowImport(false)}
              onImported={() => refetchMenu?.()}
            />
          )}

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
                Loading menu items…
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                  <span className="h-5 w-5">{Icons.menu}</span>
                </div>
                <h3 className="text-base font-semibold">
                  {normalizedQuery ? 'No matches' : 'No menu items yet'}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {normalizedQuery
                    ? 'Try a different search term or clear the filter.'
                    : 'Add your first item to get started.'}
                </p>
                {!normalizedQuery && (
                  <Button
                    size="sm"
                    onClick={() => { setEditingItem(null); setShowForm(true); }}
                    className="mt-4 gap-1.5"
                  >
                    <span className="h-4 w-4">{Icons.plus}</span>
                    Add Item
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div
              className={cn(
                'grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 transition-opacity',
                reordering && 'opacity-60 pointer-events-none'
              )}
            >
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  onDragOver={dragEnabled ? onDragOver : undefined}
                  onDrop={dragEnabled ? onDrop(item.id) : undefined}
                  className={cn(
                    'group relative flex flex-col gap-3 transition-all',
                    !item.is_available && 'opacity-60'
                  )}
                >
                  <div className="relative">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-sm ring-1 ring-black/5 transition-shadow group-hover:shadow-md">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      ) : item.emoji ? (
                        <div className="flex h-full w-full items-center justify-center text-6xl">{item.emoji}</div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <span className="h-10 w-10 opacity-40">{Icons.image || Icons.menu}</span>
                        </div>
                      )}
                    </div>

                    {dragEnabled && (
                      <span
                        draggable
                        onDragStart={onDragStart(item.id)}
                        title="Drag to reorder"
                        className="absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 backdrop-blur text-muted-foreground shadow-md cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity select-none text-sm font-bold tracking-tighter"
                      >
                        ⋮⋮
                      </span>
                    )}

                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.is_available}
                      aria-label={item.is_available ? 'Mark as unavailable' : 'Mark as available'}
                      onClick={() => toggleAvailability(item)}
                      className={cn(
                        'absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 backdrop-blur shadow-md transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        item.is_available ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill={item.is_available ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5 px-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="font-bold text-base leading-tight truncate">{item.name}</h4>
                      <span className="text-base font-bold tabular-nums shrink-0">
                        ${parseFloat(item.price).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      {item.category && (
                        <>
                          <span className="capitalize">{item.category}</span>
                          <span className="text-border">•</span>
                        </>
                      )}
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 font-medium',
                          item.is_available ? 'text-positive' : 'text-muted-foreground'
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            item.is_available ? 'bg-positive' : 'bg-muted-foreground'
                          )}
                        />
                        {item.is_available ? 'Available' : 'Hidden'}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 leading-snug">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditForm(item)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <span className="h-3.5 w-3.5">{Icons.edit}</span>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <span className="h-3.5 w-3.5">{Icons.trash}</span>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Orders Tab
const ORDER_FILTER_KEYS = [
  'all',
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'rejected',
  'abandoned',
];

// Cancelled-with-failed-payment means the customer started online checkout
// but never submitted a card — display these as "Abandoned" so they don't
// get conflated with real owner/customer cancellations of placed orders.
const getDerivedOrderStatus = (o) => {
  if (o.status === 'cancelled' && o.payment_status === 'failed') return 'abandoned';
  return o.status;
};

const ORDER_DATE_RANGES = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'all', label: 'All time' },
];

const isOrderInRange = (order, range) => {
  if (range === 'all') return true;
  const created = new Date(order.created_at);
  if (Number.isNaN(created.getTime())) return false;
  const now = new Date();
  if (range === 'today') {
    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth() &&
      created.getDate() === now.getDate()
    );
  }
  const days = range === '7d' ? 7 : 30;
  return now.getTime() - created.getTime() <= days * 24 * 60 * 60 * 1000;
};

const PENDING_STATUSES = new Set(['pending', 'confirmed', 'preparing']);

const OrdersTab = ({ orders, loading }) => {
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');

  const dateScopedOrders = orders.filter(o => isOrderInRange(o, dateRange));

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredOrders = dateScopedOrders.filter(o => {
    const statusOk =
      filter === 'all' || getDerivedOrderStatus(o) === filter;
    if (!statusOk) return false;
    if (!normalizedQuery) return true;
    return (
      String(o.order_number || '').toLowerCase().includes(normalizedQuery) ||
      String(o.customer_name || '').toLowerCase().includes(normalizedQuery)
    );
  });

  const todaysOrders = orders.filter(o => isOrderInRange(o, 'today'));
  const todaysRevenue = todaysOrders.reduce(
    (sum, o) => sum + (parseFloat(o.total) || 0),
    0
  );
  const pendingNow = orders.filter(o =>
    PENDING_STATUSES.has(getDerivedOrderStatus(o))
  ).length;
  const completedCount = dateScopedOrders.filter(
    o => getDerivedOrderStatus(o) === 'completed'
  ).length;
  const avgTicket = completedCount > 0
    ? dateScopedOrders
        .filter(o => getDerivedOrderStatus(o) === 'completed')
        .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) / completedCount
    : 0;

  const stats = [
    {
      label: "Today's orders",
      value: todaysOrders.length,
      tone: 'info',
      iconKey: 'orders',
    },
    {
      label: "Today's revenue",
      value: `$${todaysRevenue.toFixed(2)}`,
      tone: 'positive',
      iconKey: 'dollarSign',
    },
    {
      label: 'Pending now',
      value: pendingNow,
      tone: 'warning',
      iconKey: 'clock',
    },
    {
      label: 'Avg ticket',
      value: `$${avgTicket.toFixed(2)}`,
      tone: 'info',
      iconKey: 'chart',
    },
  ];

  const dateRangeLabel =
    ORDER_DATE_RANGES.find(r => r.key === dateRange)?.label || 'All time';

  return (
    <div className="tab-content">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Order history and reporting. Use the Kitchen tab to manage active orders.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg shrink-0',
                  TONE_CHIP[stat.tone]
                )}
              >
                <span className="h-4 w-4">{Icons[stat.iconKey] || Icons.orders}</span>
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold tracking-tight leading-tight tabular-nums truncate">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground truncate">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 mb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
            {Icons.search}
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order # or customer…"
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {ORDER_DATE_RANGES.map(range => {
            const isActive = dateRange === range.key;
            return (
              <button
                key={range.key}
                onClick={() => setDateRange(range.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-5">
        {ORDER_FILTER_KEYS.map(status => {
          const isActive = filter === status;
          const count = status === 'all'
            ? dateScopedOrders.length
            : dateScopedOrders.filter(o => getDerivedOrderStatus(o) === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {status === 'all' ? 'All Orders' : ORDER_STATUS_LABEL[status]}
              <span
                className={cn(
                  'rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
                  isActive ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
            Loading orders…
          </CardContent>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <span className="h-5 w-5">{Icons.orders}</span>
            </div>
            <h3 className="text-base font-semibold">
              {normalizedQuery
                ? 'No matching orders'
                : filter === 'all'
                  ? `No orders ${dateRangeLabel.toLowerCase()}`
                  : `No ${ORDER_STATUS_LABEL[filter]?.toLowerCase() || filter} orders ${dateRangeLabel.toLowerCase()}`}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {normalizedQuery
                ? 'Try a different search term or clear the filter.'
                : 'Orders placed by customers will appear here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Table view (md+) */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.map(order => {
                    const derived = getDerivedOrderStatus(order);
                    return (
                      <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-semibold">{order.order_number}</td>
                        <td className="px-4 py-3">{order.customer_name || 'Customer'}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {order.item_count || 0} items
                        </td>
                        <td className="px-4 py-3 font-semibold tabular-nums">
                          ${parseFloat(order.total).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground tabular-nums">
                          {formatRelativeTime(order.created_at, 'minutes')}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={ORDER_STATUS_BADGE[derived] || 'secondary'}>
                            {ORDER_STATUS_LABEL[derived] || derived}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Stacked card view (mobile) */}
          <div className="md:hidden flex flex-col gap-3">
            {filteredOrders.map(order => {
              const derived = getDerivedOrderStatus(order);
              return (
                <Card key={order.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">
                          {order.order_number}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {order.customer_name || 'Customer'}
                        </div>
                      </div>
                      <Badge
                        variant={ORDER_STATUS_BADGE[derived] || 'secondary'}
                        className="shrink-0"
                      >
                        {ORDER_STATUS_LABEL[derived] || derived}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{order.item_count || 0} items</span>
                      <span className="tabular-nums">
                        {formatRelativeTime(order.created_at, 'minutes')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="text-xs text-muted-foreground">Total</span>
                      <span className="text-sm font-bold tabular-nums">
                        ${parseFloat(order.total).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// Analytics Tab
const AnalyticsTab = ({ trucks, orders }) => {
  const { isPlus, plans, openCheckout, loading: subLoading } = useCravvrSubscription();
  const [period, setPeriod] = useState('week');
  const [upgrading, setUpgrading] = useState(false);

  // Free users are locked to the weekly view. If their state somehow holds
  // a gated period (e.g. a stored preference from before the gate), snap back.
  useEffect(() => {
    if (!subLoading && !isPlus && period !== 'week') setPeriod('week');
  }, [subLoading, isPlus, period]);

  const plusPlan = plans?.find?.((p) => p.code === 'plus');
  const plusPriceLabel = plusPlan
    ? `$${(plusPlan.price_cents / 100).toFixed(plusPlan.price_cents % 100 === 0 ? 0 : 2)}/${plusPlan.interval || 'mo'}`
    : '';

  const handleUpgrade = async () => {
    setUpgrading(true);
    try { await openCheckout('plus'); }
    catch { setUpgrading(false); }
  };

  const lockSuffix = isPlus ? '' : ' — Cravvr Go';

  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month': {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 1);
        return d;
      }
      case '30days': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year': {
        const d = new Date(now);
        d.setFullYear(d.getFullYear() - 1);
        return d;
      }
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  };

  const periodStart = getDateRange();
  const periodOrders = orders.filter(o => new Date(o.created_at) >= periodStart);

  // Calculate chart data based on period
  const getChartData = () => {
    if (period === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const data = days.map(day => ({ label: day, orders: 0, revenue: 0 }));
      periodOrders.forEach(order => {
        const dayIndex = (new Date(order.created_at).getDay() + 6) % 7; // Monday = 0
        data[dayIndex].orders += 1;
        data[dayIndex].revenue += parseFloat(order.total || 0);
      });
      return data;
    } else if (period === 'month' || period === '30days') {
      // Group by week
      const weeks = [];
      for (let i = 0; i < 4; i++) {
        weeks.push({ label: `Week ${i + 1}`, orders: 0, revenue: 0 });
      }
      periodOrders.forEach(order => {
        const daysSinceStart = Math.floor((new Date(order.created_at) - periodStart) / (24 * 60 * 60 * 1000));
        const weekIndex = Math.min(Math.floor(daysSinceStart / 7), 3);
        weeks[weekIndex].orders += 1;
        weeks[weekIndex].revenue += parseFloat(order.total || 0);
      });
      return weeks;
    } else {
      // Year: group by month
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const data = months.map(m => ({ label: m, orders: 0, revenue: 0 }));
      periodOrders.forEach(order => {
        const monthIndex = new Date(order.created_at).getMonth();
        data[monthIndex].orders += 1;
        data[monthIndex].revenue += parseFloat(order.total || 0);
      });
      return data;
    }
  };

  const chartData = getChartData();
  const totalRevenue = periodOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
  const totalOrders = periodOrders.length;

  // Calculate average order value for the period
  const avgOrderValue = periodOrders.length > 0
    ? totalRevenue / periodOrders.length
    : 0;

  // Calculate orders per day for the period
  const dayCount = Math.max(1, Math.ceil((Date.now() - periodStart.getTime()) / (24 * 60 * 60 * 1000)));
  const ordersPerDay = periodOrders.length > 0 ? (periodOrders.length / dayCount).toFixed(1) : 0;

  // Find best performing truck
  const bestTruck = trucks.reduce((best, truck) => {
    if (!best || (truck.today_revenue || 0) > (best.today_revenue || 0)) return truck;
    return best;
  }, null);

  const periodLabels = {
    week: 'This Week',
    month: 'This Month',
    '30days': 'Last 30 Days',
    year: 'This Year',
  };

  const chartTitle = period === 'week' ? 'Daily Revenue' : period === 'year' ? 'Monthly Revenue' : 'Weekly Revenue';

  // Tremor BarChart expects data with a categorical axis key + value keys.
  const chartDataForTremor = chartData.map(d => ({ date: d.label, Revenue: d.revenue }));

  // Tremor BarList expects { name, value } items.
  const truckPerformanceData = trucks
    .map(t => ({ name: t.name, value: Math.round(t.today_revenue || 0) }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="tab-content">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your performance and insights.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="week">This Week</option>
            <option value="month" disabled={!isPlus && !subLoading}>This Month{lockSuffix}</option>
            <option value="30days" disabled={!isPlus && !subLoading}>Last 30 Days{lockSuffix}</option>
            <option value="year" disabled={!isPlus && !subLoading}>This Year{lockSuffix}</option>
          </select>
          {!isPlus && !subLoading && (
            <Button
              size="sm"
              onClick={handleUpgrade}
              disabled={upgrading}
            >
              {upgrading
                ? 'Loading…'
                : `Unlock Cravvr Go${plusPriceLabel ? ` — ${plusPriceLabel}` : ''}`}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>{chartTitle}</CardTitle>
            <span className="text-sm font-semibold tabular-nums text-positive">
              ${totalRevenue.toFixed(0)} total
            </span>
          </CardHeader>
          <CardContent>
            <BarChart
              data={chartDataForTremor}
              index="date"
              categories={['Revenue']}
              colors={['rose']}
              valueFormatter={(v) => `$${v.toFixed(0)}`}
              yAxisWidth={48}
              showLegend={false}
              className="h-64"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Truck Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {truckPerformanceData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No trucks yet</p>
            ) : (
              <BarList
                data={truckPerformanceData}
                valueFormatter={(v) => `$${v}`}
                color="rose"
                className="text-sm"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              <li className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <span className="text-sm text-muted-foreground">Average Order Value</span>
                <span className="text-sm font-semibold tabular-nums">
                  ${avgOrderValue.toFixed(2)}
                </span>
              </li>
              <li className="flex items-center justify-between py-2.5">
                <span className="text-sm text-muted-foreground">Orders Per Day</span>
                <span className="text-sm font-semibold tabular-nums">{ordersPerDay}</span>
              </li>
              <li className="flex items-center justify-between py-2.5">
                <span className="text-sm text-muted-foreground">
                  {periodLabels[period]} Orders
                </span>
                <span className="text-sm font-semibold tabular-nums">{totalOrders}</span>
              </li>
              <li className="flex items-center justify-between py-2.5 last:pb-0">
                <span className="text-sm text-muted-foreground">Active Trucks</span>
                <span className="text-sm font-semibold tabular-nums">
                  {trucks.filter(t => t.is_open).length}/{trucks.length}
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info shrink-0">
                  {Icons.chart}
                </span>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Total Orders</div>
                  <div className="text-sm font-semibold truncate">
                    {orders.length} all time
                  </div>
                </div>
              </div>
              {bestTruck && (
                <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-positive/10 text-positive shrink-0">
                    {Icons.truck}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Best Today</div>
                    <div className="text-sm font-semibold truncate">{bestTruck.name}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning shrink-0">
                  {Icons.star}
                </span>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Average Rating</div>
                  <div className="text-sm font-semibold">
                    {trucks.filter(t => t.average_rating).length > 0
                      ? (
                          trucks
                            .filter(t => t.average_rating)
                            .reduce((sum, t) => sum + parseFloat(t.average_rating), 0) /
                          trucks.filter(t => t.average_rating).length
                        ).toFixed(1)
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Settings Tab
const SettingsTab = () => {
  const { showToast } = useToast();
  const { profile, updateProfile, user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [profileData, setProfileData] = useState({
    name: profile?.name || '',
    avatar_url: profile?.avatar_url || '',
    phone: '',
  });
  const [businessData, setBusinessData] = useState({
    business_name: '',
    tax_id: '',
    business_address: '',
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    new_order_alerts: true,
    daily_summary: true,
    marketing_emails: false,
  });
  const [queueSettings, setQueueSettings] = useState({
    maxQueueSize: 20,
    autoPauseEnabled: false,
  });
  const [savingQueue, setSavingQueue] = useState(false);
  const [firstTruckId, setFirstTruckId] = useState(null);

  // Load owner data on mount
  useEffect(() => {
    const loadOwnerData = async () => {
      if (!user?.id) return;
      const data = await fetchOwnerSelf(user.id).catch(() => null);
      if (data) {
        setProfileData(prev => ({ ...prev, phone: data.phone || '' }));
        setBusinessData({
          business_name: data.business_name || '',
          tax_id: data.tax_id || '',
          business_address: data.business_address || '',
        });
        if (data.notification_preferences) {
          setNotificationPrefs(prev => ({ ...prev, ...data.notification_preferences }));
        }
      }

      // Load queue settings from first truck (oldest-first).
      const truckData = await fetchOwnerFirstTruckQueueSettings(user.id).catch(() => null);
      if (truckData) {
        setFirstTruckId(truckData.id);
        setQueueSettings({
          maxQueueSize: truckData.max_queue_size || 20,
          autoPauseEnabled: truckData.auto_pause_enabled || false,
        });
      }
    };
    loadOwnerData();
  }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name: profileData.name, avatar_url: profileData.avatar_url });
      await updateOwnerSelf(user.id, { phone: profileData.phone });
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to save profile:', err);
      showToast('Failed to save profile changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBusinessSubmit = async (e) => {
    e.preventDefault();
    setSavingBusiness(true);
    try {
      await updateOwnerSelf(user.id, businessData);
      showToast('Business information saved!', 'success');
    } catch (err) {
      console.error('Failed to save business info:', err);
      showToast('Failed to save business information', 'error');
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleNotificationChange = async (key, value) => {
    const updated = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(updated);
    setSavingNotifications(true);
    try {
      await updateOwnerSelf(user.id, { notification_preferences: updated });
      showToast('Notification preferences saved', 'success');
    } catch (err) {
      console.error('Failed to save notification preferences:', err);
      setNotificationPrefs(notificationPrefs); // revert
      showToast('Failed to save notification preferences', 'error');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleQueueSettingsSave = async (e) => {
    e.preventDefault();
    if (!firstTruckId) {
      showToast('No truck found to save queue settings for', 'error');
      return;
    }
    setSavingQueue(true);
    try {
      await updateTruckQueueSettings(firstTruckId, queueSettings);
      showToast('Kitchen capacity settings saved!', 'success');
    } catch (err) {
      console.error('Failed to save queue settings:', err);
      showToast('Failed to save kitchen capacity settings', 'error');
    } finally {
      setSavingQueue(false);
    }
  };

  return (
    <div className="tab-content">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and preferences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="lg:col-span-2">
          <CravvrPlusBilling />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <ImageUpload
                label="Profile Picture"
                currentImage={profileData.avatar_url}
                onUpload={(url) => setProfileData({ ...profileData, avatar_url: url })}
                bucket="images"
                folder={user?.id ? `profiles/${user.id}` : 'profiles/temp'}
                disabled={saving}
              />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="profile-name">Full Name</Label>
                <Input
                  id="profile-name"
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="profile-email">Email</Label>
                <Input id="profile-email" type="email" defaultValue={user?.email} disabled />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input
                  id="profile-phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={saving} className="self-start">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBusinessSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="business-name">Business Name</Label>
                <Input
                  id="business-name"
                  type="text"
                  placeholder="Your business name"
                  value={businessData.business_name}
                  onChange={(e) => setBusinessData({ ...businessData, business_name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="business-tax">Tax ID (EIN)</Label>
                <Input
                  id="business-tax"
                  type="text"
                  placeholder="XX-XXXXXXX"
                  value={businessData.tax_id}
                  onChange={(e) => setBusinessData({ ...businessData, tax_id: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="business-address">Business Address</Label>
                <Textarea
                  id="business-address"
                  placeholder="Enter business address"
                  rows={2}
                  value={businessData.business_address}
                  onChange={(e) => setBusinessData({ ...businessData, business_address: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={savingBusiness} className="self-start">
                {savingBusiness ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y divide-border">
              {[
                { key: 'new_order_alerts', title: 'New Order Alerts', desc: 'Get notified when you receive a new order' },
                { key: 'daily_summary', title: 'Daily Summary', desc: 'Receive daily sales summary email' },
                { key: 'marketing_emails', title: 'Marketing Emails', desc: 'Tips and updates from Cravvr' },
              ].map(opt => (
                <label
                  key={opt.key}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={notificationPrefs[opt.key]}
                    onChange={(e) => handleNotificationChange(opt.key, e.target.checked)}
                    disabled={savingNotifications}
                    className="mt-0.5 h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 accent-primary"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium leading-tight">{opt.title}</span>
                    <span className="text-xs text-muted-foreground">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kitchen Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleQueueSettingsSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="queue-size">Max Active Orders (Queue Size)</Label>
                <Input
                  id="queue-size"
                  type="number"
                  min="1"
                  max="100"
                  value={queueSettings.maxQueueSize}
                  onChange={(e) => setQueueSettings(prev => ({ ...prev, maxQueueSize: parseInt(e.target.value) || 20 }))}
                />
                <span className="text-xs text-muted-foreground">
                  Maximum number of active orders before auto-pausing
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-sm font-medium">Auto-pause when queue is full</span>
                  <input
                    type="checkbox"
                    checked={queueSettings.autoPauseEnabled}
                    onChange={(e) => setQueueSettings(prev => ({ ...prev, autoPauseEnabled: e.target.checked }))}
                    className="h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 accent-primary"
                  />
                </label>
                <span className="text-xs text-muted-foreground">
                  Automatically stop accepting orders when the queue reaches the max size
                </span>
              </div>
              <Button type="submit" disabled={savingQueue} className="self-start">
                {savingQueue ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-2 max-w-md">
                <Badge variant="secondary" className="self-start">Free Plan</Badge>
                <p className="text-sm text-muted-foreground">
                  You're on the free plan with basic features.
                </p>
                <ul className="flex flex-col gap-1.5 mt-2">
                  {['Priority support', 'Advanced analytics', 'Multiple truck management', 'Custom branding'].map(feat => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-4 w-4 shrink-0 text-positive">{Icons.check}</span>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                onClick={() => showToast('Pro plan coming soon!', 'info')}
                className="gap-2 self-start"
              >
                <span className="h-4 w-4 shrink-0">{Icons.trendingUp}</span>
                Upgrade to Pro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Main Owner Dashboard Component
const OwnerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, profile, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  // Data state
  const [trucks, setTrucks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedTruckId, setSelectedTruckId] = useState(null);

  // Loading states
  const [loadingTrucks, setLoadingTrucks] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);

  // Error state
  const [error, setError] = useState(null);

  // Fetch trucks for this owner. Routes through services/trucks.js so the
  // 1+3N query pattern is collapsed into 3 total queries (truck list +
  // ratings + orders) and aggregated client-side.
  const fetchTrucks = useCallback(async () => {
    if (!user?.id) return;
    setLoadingTrucks(true);
    try {
      const trucksWithStats = await fetchOwnerTrucksWithStats(user.id);
      setTrucks(trucksWithStats);

      // Auto-select: ?truckId=… from URL takes precedence (used when an admin
      // clicks "View as owner" on a specific truck), otherwise pick the first
      if (trucksWithStats.length > 0 && !selectedTruckId) {
        const params = new URLSearchParams(window.location.search);
        const requested = params.get('truckId');
        const match = requested && trucksWithStats.find(t => t.id === requested);
        setSelectedTruckId(match ? match.id : trucksWithStats[0].id);
      }
    } catch (err) {
      console.error('Error fetching trucks:', err);
      setError('Failed to load trucks');
    } finally {
      setLoadingTrucks(false);
    }
  }, [user?.id, selectedTruckId]);

  // Fetch orders for owner's trucks
  const fetchOrders = useCallback(async () => {
    if (!user?.id || trucks.length === 0) {
      setLoadingOrders(false);
      return;
    }
    setLoadingOrders(true);
    try {
      const formattedOrders = await fetchOwnerOrders(trucks.map((t) => t.id));
      setOrders(formattedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  }, [user?.id, trucks]);

  // Fetch menu items for selected truck
  const fetchMenuItems = useCallback(async () => {
    if (!selectedTruckId) {
      setMenuItems([]);
      return;
    }
    setLoadingMenu(true);
    try {
      setMenuItems(await fetchMenuItemsRaw(selectedTruckId));
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to load menu items');
    } finally {
      setLoadingMenu(false);
    }
  }, [selectedTruckId]);

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      fetchTrucks();
    }
  }, [user?.id, fetchTrucks]);

  // Fetch orders when trucks are loaded
  useEffect(() => {
    if (trucks.length > 0) {
      fetchOrders();
    }
  }, [trucks.length, fetchOrders]);

  // Fetch menu items when selected truck changes
  useEffect(() => {
    fetchMenuItems();
  }, [selectedTruckId, fetchMenuItems]);

  // Real-time subscription for orders
  useEffect(() => {
    if (trucks.length === 0) return;

    const truckIds = trucks.map(t => t.id);

    // Subscribe to orders changes for this owner's trucks
    const subscription = supabase
      .channel('owner-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `truck_id=in.(${truckIds.join(',')})`,
        },
        async (payload) => {
          const formattedOrder = await fetchOwnerOrderById(payload.new.id).catch(() => null);
          if (formattedOrder) {
            setOrders(prev => [formattedOrder, ...prev]);
            showToast(`New order #${formattedOrder.order_number} from ${formattedOrder.customer_name}!`, 'success');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `truck_id=in.(${truckIds.join(',')})`,
        },
        (payload) => {
          setOrders(prev =>
            prev.map(order =>
              order.id === payload.new.id
                ? { ...order, ...payload.new }
                : order
            )
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [trucks]);

  // Real-time subscription for the owner's trucks themselves. Catches
  // webhook-driven changes (Stripe Connect onboarding completion flips
  // stripe_charges_enabled, Square OAuth callback flips square_charges_enabled,
  // etc.) and triggers a fresh fetch so the UI stays in sync without F5.
  useEffect(() => {
    if (!user?.id) return;
    const sub = supabase
      .channel(`owner-trucks-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_trucks',
          filter: `owner_id=eq.${user.id}`,
        },
        () => { fetchTrucks(); },
      )
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [user?.id, fetchTrucks]);

  // CRUD operations for trucks. We always re-fetch from the server after any
  // mutation rather than optimistic-merging because:
  //   1. food_trucks has generated columns (online_payment_enabled) that the
  //      client can't compute locally.
  //   2. Some fields are flipped by webhooks (stripe_charges_enabled,
  //      square_charges_enabled) and the optimistic merge doesn't see those.
  //   3. Stats (today_orders, today_revenue) are aggregated server-side.
  // Result: one source of truth, no "I have to refresh to see the change".
  const handleTruckCreate = async (truckData) => {
    const data = await createOwnerTruck(user.id, truckData);
    await fetchTrucks();
    if (!selectedTruckId) setSelectedTruckId(data.id);
  };

  const handleTruckUpdate = async (truckId, updates) => {
    if (updates && Object.keys(updates).length > 0) {
      await updateTruckService(truckId, updates);
    }
    await fetchTrucks();
  };

  const handleTruckDelete = async (truckId) => {
    await deleteOwnerTruck(truckId);
    await fetchTrucks();
    if (selectedTruckId === truckId) {
      const remaining = trucks.filter(t => t.id !== truckId);
      setSelectedTruckId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // CRUD operations for menu items
  const handleMenuItemCreate = async (itemData) => {
    const data = await createMenuItem({ ...itemData, is_available: true });
    setMenuItems(prev => [...prev, data]);
  };

  const handleMenuItemUpdate = async (itemId, updates) => {
    await updateMenuItem(itemId, updates);
    setMenuItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
  };

  const handleMenuItemDelete = async (itemId) => {
    await deleteMenuItem(itemId);
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Calculate stats for overview
  const calculateStats = () => {
    const todayOrders = trucks.reduce((sum, t) => sum + (t.today_orders || 0), 0);
    const todayRevenue = trucks.reduce((sum, t) => sum + (t.today_revenue || 0), 0);
    const avgRating = trucks.length > 0
      ? trucks.filter(t => t.average_rating).reduce((sum, t) => sum + parseFloat(t.average_rating), 0) / trucks.filter(t => t.average_rating).length
      : 0;
    const totalCustomers = orders.length; // Simplified - could be unique customers

    return [
      { label: "Today's Orders", value: todayOrders.toString(), icon: Icons.orders, color: '#e11d48' },
      { label: "Today's Revenue", value: `$${todayRevenue.toFixed(0)}`, icon: Icons.dollar, color: '#16a34a' },
      { label: 'Avg Rating', value: avgRating ? avgRating.toFixed(1) : 'N/A', icon: Icons.star, color: '#f59e0b' },
      { label: 'Total Orders', value: orders.length.toString(), icon: Icons.users, color: '#3b82f6' },
    ];
  };

  if (authLoading) {
    return <LoadingSplash />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            setActiveTab={setActiveTab}
            trucks={trucks}
            orders={orders}
            stats={calculateStats()}
          />
        );
      case 'trucks':
        return (
          <TrucksTab
            trucks={trucks}
            setTrucks={setTrucks}
            onTruckCreate={handleTruckCreate}
            onTruckUpdate={handleTruckUpdate}
            onTruckDelete={handleTruckDelete}
            loading={loadingTrucks}
          />
        );
      case 'menu':
        return (
          <MenuTab
            menuItems={menuItems}
            setMenuItems={setMenuItems}
            refetchMenu={fetchMenuItems}
            trucks={trucks}
            selectedTruckId={selectedTruckId}
            onTruckSelect={setSelectedTruckId}
            onMenuItemCreate={handleMenuItemCreate}
            onMenuItemUpdate={handleMenuItemUpdate}
            onMenuItemDelete={handleMenuItemDelete}
            loading={loadingMenu}
          />
        );
      case 'orders':
        return (
          <OrdersTab
            orders={orders}
            loading={loadingOrders}
          />
        );
      case 'kitchen':
        return (
          <KitchenDisplay
            orders={orders}
            trucks={trucks}
          />
        );
      case 'payments':
        return <PaymentsDashboard trucks={trucks} />;
      case 'analytics':
        return <AnalyticsTab trucks={trucks} orders={orders} />;
      case 'settings':
        return <SettingsTab />;
      default:
        return (
          <OverviewTab
            setActiveTab={setActiveTab}
            trucks={trucks}
            orders={orders}
            stats={calculateStats()}
          />
        );
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Icons.chart },
    { id: 'trucks', label: 'My Trucks', icon: Icons.truck },
    { id: 'menu', label: 'Menu', icon: Icons.menu },
    { id: 'orders', label: 'Orders', icon: Icons.orders },
    { id: 'kitchen', label: 'Kitchen', icon: Icons.clock },
    { id: 'payments', label: 'Payments', icon: Icons.creditCard },
    { id: 'analytics', label: 'Analytics', icon: Icons.trendingUp },
    { id: 'settings', label: 'Settings', icon: Icons.settings },
  ];

  return (
    <div className="owner-dashboard-content">
      {/* Horizontal Tab Navigation */}
      <div className="owner-tabs">
        <div className="owner-tabs-header">
          <h1 className="owner-title">Owner Dashboard</h1>
        </div>
        <nav className="owner-tabs-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`owner-tab ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="tab-icon">{item.icon}</span>
              <span className="tab-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="owner-tab-content">
        {error && (
          <div className="mx-auto max-w-7xl px-4 pt-4">
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <span className="h-5 w-5 shrink-0 mt-0.5">{Icons.alertCircle}</span>
              <p className="flex-1 leading-snug">{error}</p>
              <button
                onClick={() => setError(null)}
                aria-label="Dismiss error"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-destructive/70 transition-colors hover:bg-destructive/15 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="h-4 w-4">{Icons.x}</span>
              </button>
            </div>
          </div>
        )}
        {renderTab()}
      </div>
    </div>
  );
};

export default OwnerDashboard;
