import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import {
  fetchAddresses as fetchAddressesService,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../../services/addresses';
import {
  fetchPaymentMethods as fetchPaymentMethodsService,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '../../services/paymentMethods';
import {
  fetchCustomerOrdersDetailed,
} from '../../services/orders';
import { fetchFavoriteTrucksWithRatings } from '../../services/favorites';
import { fetchUserCheckIns } from '../../services/checkIns';
import { updateCustomerProfile, claimPunchCardReward } from '../../services/customers';
import { submitOrderReview } from '../../services/reviews';
import { Icons } from '../common/Icons';
import { formatDate } from '../../utils/formatters';
import PunchCard from './PunchCard';
import { useCart } from '../../contexts/CartContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DashboardSidebar, DashboardShell } from '@/components/ui/dashboard-sidebar';
import { cn } from '@/lib/utils';
import './CustomerProfile.css';

// Maps customer-side order status values to Badge variants for consistent styling.
const CUSTOMER_ORDER_STATUS = {
  pending: { variant: 'info', label: 'Order Received' },
  confirmed: { variant: 'info', label: 'Confirmed' },
  preparing: { variant: 'warning', label: 'Being Prepared' },
  ready: { variant: 'positive', label: 'Ready for Pickup' },
  completed: { variant: 'secondary', label: 'Completed' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
};

// Header Component
const ProfileHeader = ({ onBack, title }) => (
  <header className="profile-header">
    <button className="back-button" onClick={onBack}>
      {Icons.chevronLeft}
    </button>
    <h1>{title}</h1>
    <div className="header-spacer"></div>
  </header>
);

// Account Overview Tab
const AccountTab = ({ profile, setActiveTab, ordersCount, favoritesCount, onEditProfile, showDesktopTitle }) => {
  const { signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error('Logout failed:', err);
      setLoggingOut(false);
    }
  };

  const menuItems = [
    { icon: Icons.orders, label: 'Order History', tab: 'orders', badge: ordersCount > 0 ? ordersCount.toString() : null },
    { icon: Icons.heart, label: 'Favorites', tab: 'favorites', badge: favoritesCount > 0 ? favoritesCount.toString() : null },
    { icon: Icons.gift, label: 'Rewards & Points', tab: 'rewards', badge: `${profile?.points || 0} pts` },
    { icon: Icons.mapPin, label: 'Saved Addresses', tab: 'addresses' },
    { icon: Icons.creditCard, label: 'Payment Methods', tab: 'payment' },
    { icon: Icons.bell, label: 'Notifications', tab: 'notifications' },
    { icon: Icons.shield, label: 'Privacy & Security', tab: 'security' },
    { icon: Icons.help, label: 'Help & Support', tab: 'help' },
  ];

  // On desktop the sidebar handles navigation; the menu list is redundant.
  // Mobile keeps the menu-list-as-home pattern (drill into a tab from here).
  const showMenuList = !showDesktopTitle;

  return (
    <div className="profile-content">
      {showDesktopTitle && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Account</h1>
            <p className="text-sm text-muted-foreground">
              Manage your profile, orders, and preferences.
            </p>
          </div>
        </div>
      )}

      <Card className="mb-4 overflow-hidden">
        <CardContent className="flex flex-col items-center text-center pt-8 pb-6 px-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-3">
            {profile?.name?.charAt(0) || 'U'}
          </div>
          <h2 className="text-lg font-semibold leading-tight">{profile?.name || 'User'}</h2>
          <p className="text-sm text-muted-foreground mb-4">{profile?.email}</p>
          <Button variant="outline" size="sm" className="gap-2" onClick={onEditProfile}>
            {Icons.edit}
            Edit Profile
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary shrink-0">
              {Icons.gift}
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-base font-semibold tabular-nums leading-tight">
                {profile?.points || 0} Points
              </span>
              <span className="text-xs text-muted-foreground">
                Earn more with every order!
              </span>
            </div>
          </div>
          <Button size="sm" onClick={() => setActiveTab('rewards')}>
            View Rewards
          </Button>
        </CardContent>
      </Card>

      {showMenuList && (
      <div className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
          Account Settings
        </h3>
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(item.tab)}
                className="group w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:bg-muted"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  {item.icon}
                </span>
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="tabular-nums">
                    {item.badge}
                  </Badge>
                )}
                <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">
                  {Icons.chevronRight}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
      )}

      <Button
        variant="outline"
        className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        {Icons.logout}
        {loggingOut ? 'Logging out...' : 'Log Out'}
      </Button>

      <p className="text-center text-xs text-muted-foreground mt-4">Cravvr v1.0.0</p>
    </div>
  );
};

// Orders Tab
const OrdersTab = ({ onBack, orders, loading, onReview, onTrack, onReorder }) => {
  const [filter, setFilter] = useState('all');

  // Map database status to display label
  const getDisplayStatus = (status) => {
    switch (status) {
      case 'pending': return 'Order Received';
      case 'confirmed': return 'Confirmed';
      case 'preparing': return 'Being Prepared';
      case 'ready': return 'Ready for Pickup';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  // Group statuses for filter tabs
  const getFilterGroup = (status) => {
    switch (status) {
      case 'completed': return 'completed';
      case 'cancelled': return 'cancelled';
      default: return 'active';
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => getFilterGroup(o.status) === filter);

  return (
    <div className="tab-page">
      <ProfileHeader onBack={onBack} title="Order History" />

      <div className="tab-content">
        <div className="flex flex-wrap items-center gap-1.5 mb-5">
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'active', label: 'Active' },
            { key: 'completed', label: 'Completed' },
          ].map(f => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {f.label}
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
              <p className="text-sm text-muted-foreground max-w-xs">
                {filter === 'all'
                  ? 'No orders yet. Start ordering to see your history!'
                  : `No ${filter} orders`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredOrders.map(order => {
              const statusInfo = CUSTOMER_ORDER_STATUS[order.status] || {
                variant: 'secondary',
                label: order.status,
              };
              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          order.truck_image ||
                          'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=100&q=80'
                        }
                        alt={order.truck_name}
                        className="h-12 w-12 rounded-md object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm leading-tight truncate">
                          {order.truck_name || 'Food Truck'}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>

                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {order.items && order.items.length > 0
                        ? order.items.map(i => i.name).join(', ')
                        : `${order.item_count || 0} items`}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-base font-bold tabular-nums">
                        ${parseFloat(order.total).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-2">
                        {order.status === 'completed' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => onReorder(order)}
                            >
                              {Icons.repeat}
                              Reorder
                            </Button>
                            {!order.has_review && (
                              <Button size="sm" className="gap-1.5" onClick={() => onReview(order)}>
                                {Icons.star}
                                Rate
                              </Button>
                            )}
                          </>
                        )}
                        {getFilterGroup(order.status) === 'active' && (
                          <Button size="sm" className="gap-1.5" onClick={() => onTrack(order)}>
                            {Icons.truck}
                            Track Order
                          </Button>
                        )}
                      </div>
                    </div>

                    {order.review_rating && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border text-xs text-muted-foreground">
                        <span>Your rating:</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span
                              key={star}
                              className={
                                star <= order.review_rating
                                  ? 'text-warning'
                                  : 'text-muted-foreground/30'
                              }
                            >
                              {Icons.star}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Favorites Tab
const FavoritesTab = ({ onBack, favorites, loading, onRemoveFavorite, onViewMenu }) => (
  <div className="tab-page">
    <ProfileHeader onBack={onBack} title="Favorites" />

    <div className="tab-content">
      <p className="text-sm text-muted-foreground mb-5">Your saved food trucks</p>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
            Loading favorites…
          </CardContent>
        </Card>
      ) : favorites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <span className="h-5 w-5">{Icons.heart}</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              No favorites yet. Explore food trucks and add your favorites!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map(truck => (
            <Card key={truck.id} className="overflow-hidden flex flex-col">
              <div className="relative aspect-[16/9] bg-muted">
                <img
                  src={
                    truck.image_url ||
                    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=200&q=80'
                  }
                  alt={truck.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <button
                  onClick={() => onRemoveFavorite(truck.id)}
                  aria-label="Remove from favorites"
                  className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm backdrop-blur transition-colors hover:bg-white"
                >
                  {Icons.heartFilled}
                </button>
                <Badge
                  variant={truck.is_open ? 'positive' : 'secondary'}
                  className="absolute top-2 left-2 shadow-sm"
                >
                  {truck.is_open ? 'Open' : 'Closed'}
                </Badge>
              </div>
              <CardContent className="flex flex-col gap-2 p-4 flex-1">
                <div>
                  <h4 className="font-semibold text-sm leading-tight truncate">{truck.name}</h4>
                  <span className="text-xs text-muted-foreground">{truck.cuisine}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-warning">{Icons.star}</span>
                  <span className="font-medium">{truck.average_rating || 'N/A'}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-auto"
                  onClick={() => onViewMenu(truck.id)}
                >
                  View Menu
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  </div>
);

// Rewards Tab
const RewardsTab = ({ onBack, points, checkIns, loading, onClaimReward }) => {
  // Group check-ins by truck for punch cards
  const punchCards = Object.values(
    (checkIns || []).reduce((acc, checkIn) => {
      const truckId = checkIn.truck_id;
      if (!acc[truckId]) {
        acc[truckId] = {
          id: truckId,
          truck: checkIn.truck_name || 'Food Truck',
          punches: 0,
          total: 10,
          reward: 'Free Item',
        };
      }
      acc[truckId].punches += 1;
      return acc;
    }, {})
  );

  return (
    <div className="tab-page">
      <ProfileHeader onBack={onBack} title="Rewards & Points" />

      <div className="tab-content space-y-5">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 overflow-hidden">
          <CardContent className="flex flex-col items-center text-center pt-8 pb-6 px-6">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold tabular-nums leading-none">{points || 0}</span>
              <span className="text-base font-semibold opacity-90">Points</span>
            </div>
            <p className="text-sm opacity-90 mt-2">Keep ordering to earn more points!</p>
            <div className="flex items-center gap-6 mt-5">
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold tabular-nums">10</span>
                <span className="text-xs opacity-90">pts per $1</span>
              </div>
              <div className="h-8 w-px bg-white/30" />
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold tabular-nums">500</span>
                <span className="text-xs opacity-90">pts = $5 off</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-base font-semibold mb-1">Punch Cards</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Get rewards from your favorite trucks
          </p>

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
                Loading…
              </CardContent>
            </Card>
          ) : punchCards.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <img
                  src="/logo/apple-touch-icon.png"
                  alt="Cravvr"
                  className="h-12 w-12 rounded-lg mb-3 opacity-80"
                />
                <p className="text-sm text-muted-foreground max-w-xs">
                  No punch cards yet. Check in at food trucks to start earning rewards!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {punchCards.map(card => (
                <PunchCard
                  key={card.id}
                  truckName={card.truck}
                  punches={card.punches}
                  total={card.total}
                  reward={card.reward}
                  onClaim={() => onClaimReward(card.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3">How to Earn</h3>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {[
                { icon: Icons.orders, tone: 'positive', title: 'Place Orders', desc: 'Earn 10 points per $1 spent' },
                { icon: Icons.star, tone: 'warning', title: 'Leave Reviews', desc: 'Earn 50 points per review' },
                { icon: Icons.mapPin, tone: 'info', title: 'Check In', desc: 'Earn 10 points per check-in' },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
                      m.tone === 'positive' && 'bg-positive/10 text-positive',
                      m.tone === 'warning' && 'bg-warning/10 text-warning',
                      m.tone === 'info' && 'bg-info/10 text-info'
                    )}
                  >
                    {m.icon}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium leading-tight">{m.title}</span>
                    <span className="text-xs text-muted-foreground">{m.desc}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Addresses Tab
const AddressesTab = ({ onBack, userId }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const fetchAddresses = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setAddresses(await fetchAddressesService(userId));
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleAdd = () => {
    setEditingAddress(null);
    setShowModal(true);
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setShowModal(true);
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await deleteAddress(addressId);
      fetchAddresses();
    } catch (err) {
      console.error('Error deleting address:', err);
      alert('Failed to delete address');
    }
  };

  const handleSave = () => {
    fetchAddresses();
  };

  return (
    <div className="tab-page">
      <ProfileHeader onBack={onBack} title="Saved Addresses" />

      <div className="tab-content space-y-3">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
              Loading addresses…
            </CardContent>
          </Card>
        ) : addresses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                <span className="h-5 w-5">{Icons.mapPin}</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                No saved addresses yet. Add one to make checkout faster!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {addresses.map(addr => (
              <Card
                key={addr.id}
                className={cn(addr.is_default && 'border-primary/40 bg-primary/5')}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                    {Icons.mapPin}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{addr.label}</span>
                      {addr.is_default && (
                        <Badge variant="positive" className="text-[10px] py-0 px-1.5">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                      {addr.address_line1}
                      {addr.address_line2 && `, ${addr.address_line2}`}
                      <br />
                      {addr.city}, {addr.state} {addr.zip_code}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleEdit(addr)}
                      aria-label="Edit address"
                    >
                      <span className="h-4 w-4">{Icons.edit}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(addr.id)}
                      aria-label="Delete address"
                    >
                      <span className="h-4 w-4">{Icons.trash}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full gap-2 border-dashed"
          onClick={handleAdd}
        >
          {Icons.plus}
          Add New Address
        </Button>
      </div>

      <AddressModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        address={editingAddress}
        onSave={handleSave}
        userId={userId}
      />
    </div>
  );
};

// Payment Tab
const PaymentTab = ({ onBack, userId }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  const fetchPayments = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setPayments(await fetchPaymentMethodsService(userId));
    } catch (err) {
      console.error('Error fetching payment methods:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleAdd = () => {
    setEditingPayment(null);
    setShowModal(true);
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setShowModal(true);
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) return;
    try {
      await deletePaymentMethod(paymentId);
      fetchPayments();
    } catch (err) {
      console.error('Error deleting payment method:', err);
      alert('Failed to delete payment method');
    }
  };

  const handleSave = () => {
    fetchPayments();
  };

  return (
    <div className="tab-page">
      <ProfileHeader onBack={onBack} title="Payment Methods" />

      <div className="tab-content space-y-3">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
              Loading payment methods…
            </CardContent>
          </Card>
        ) : payments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                <span className="h-5 w-5">{Icons.creditCard}</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                No payment methods saved yet. Add one for faster checkout!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {payments.map(card => (
              <Card
                key={card.id}
                className={cn(card.is_default && 'border-primary/40 bg-primary/5')}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                    {Icons.creditCard}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm tabular-nums">
                        {card.card_type} •••• {card.last_four}
                      </span>
                      {card.is_default && (
                        <Badge variant="positive" className="text-[10px] py-0 px-1.5">
                          Default
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      Expires {String(card.expiry_month).padStart(2, '0')}/{card.expiry_year}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleEdit(card)}
                      aria-label="Edit payment method"
                    >
                      <span className="h-4 w-4">{Icons.edit}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(card.id)}
                      aria-label="Delete payment method"
                    >
                      <span className="h-4 w-4">{Icons.trash}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full gap-2 border-dashed"
          onClick={handleAdd}
        >
          {Icons.plus}
          Add Payment Method
        </Button>
      </div>

      <PaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        payment={editingPayment}
        onSave={handleSave}
        userId={userId}
      />
    </div>
  );
};

// Notifications Tab
const NotificationsTab = ({ onBack }) => {
  const [settings, setSettings] = useState({
    orderUpdates: true,
    promotions: true,
    newTrucks: false,
    favorites: true,
    rewards: true,
  });

  const toggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const items = [
    { key: 'orderUpdates', title: 'Order Updates', desc: 'Get notified about your order status' },
    { key: 'promotions', title: 'Promotions & Deals', desc: 'Special offers from food trucks' },
    { key: 'newTrucks', title: 'New Trucks Nearby', desc: 'Discover new trucks in your area' },
    { key: 'favorites', title: 'Favorite Truck Updates', desc: 'When your favorites are nearby or have deals' },
    { key: 'rewards', title: 'Rewards & Points', desc: 'Updates about your rewards status' },
  ];

  return (
    <div className="tab-page">
      <ProfileHeader onBack={onBack} title="Notifications" />

      <div className="tab-content">
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {items.map(item => (
              <label
                key={item.key}
                className="flex items-center justify-between gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/40"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium leading-tight">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.desc}</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings[item.key]}
                  onClick={() => toggle(item.key)}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    settings[item.key] ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                      settings[item.key] ? 'translate-x-[22px]' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </label>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Security Tab
const SecurityRow = ({ icon, label, status, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:bg-muted"
  >
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
      {icon}
    </span>
    <span className="flex-1 text-sm font-medium">{label}</span>
    {status && (
      <span className="text-xs text-muted-foreground">{status}</span>
    )}
    <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">
      {Icons.chevronRight}
    </span>
  </button>
);

const SecurityTab = ({ onBack, onChangePassword }) => (
  <div className="tab-page">
    <ProfileHeader onBack={onBack} title="Privacy & Security" />

    <div className="tab-content space-y-5">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
          Account Security
        </h3>
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            <SecurityRow icon={Icons.edit} label="Change Password" onClick={onChangePassword} />
            <SecurityRow icon={Icons.shield} label="Two-Factor Authentication" status="Off" />
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
          Privacy
        </h3>
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            <SecurityRow icon={Icons.mapPin} label="Location Permissions" />
            <SecurityRow icon={Icons.user} label="Data & Personalization" />
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-destructive mb-2 px-1">
          Danger Zone
        </h3>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex flex-col gap-2 items-start">
            <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
              Delete Account
            </Button>
            <p className="text-xs text-muted-foreground">
              This will permanently delete your account and all associated data.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

// Help Tab
const HelpTab = ({ onBack }) => (
  <div className="tab-page">
    <ProfileHeader onBack={onBack} title="Help & Support" />

    <div className="tab-content space-y-5">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
          {Icons.search || Icons.help}
        </span>
        <Input
          type="search"
          placeholder="Search for help…"
          className="pl-9"
        />
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
          Quick Help
        </h3>
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {[
              'How do I track my order?',
              'How do rewards work?',
              'How to update payment method?',
              'Cancellation & refund policy',
            ].map(q => (
              <button
                key={q}
                type="button"
                className="group w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:bg-muted"
              >
                <span className="flex-1">{q}</span>
                <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">
                  {Icons.chevronRight}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
          Contact Us
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="outline" className="h-auto justify-start gap-3 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10 text-info">
              {Icons.help}
            </span>
            <span className="font-medium">Chat with Support</span>
          </Button>
          <Button variant="outline" className="h-auto justify-start gap-3 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-positive/10 text-positive">
              {Icons.edit}
            </span>
            <span className="font-medium">Send Email</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
);

// Review Modal
const ReviewModal = ({ isOpen, onClose, order, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ rating, comment, orderId: order.id, truckId: order.truck_id });
      onClose();
      setRating(0);
      setComment('');
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Order</DialogTitle>
          <DialogDescription>
            <strong className="text-foreground">{order?.truck_name}</strong>
            <br />
            <span className="text-xs">{formatDate(order?.created_at)}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Your Rating</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={cn(
                    'h-9 w-9 flex items-center justify-center rounded-md transition-colors hover:bg-muted',
                    star <= rating ? 'text-warning' : 'text-muted-foreground/40'
                  )}
                  aria-label={`Rate ${star} stars`}
                >
                  {Icons.star}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="review-comment">Your Review (Optional)</Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience…"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Track Order Modal
const TrackOrderModal = ({ isOpen, onClose, order }) => {
  const statusSteps = [
    { status: 'pending', label: 'Order Placed' },
    { status: 'confirmed', label: 'Confirmed' },
    { status: 'preparing', label: 'Preparing' },
    { status: 'ready', label: 'Ready' },
    { status: 'completed', label: 'Completed' },
  ];

  const currentStatusIndex = statusSteps.findIndex(s => s.status === order?.status);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Track Order</DialogTitle>
          <DialogDescription>
            <strong className="text-foreground">{order?.truck_name}</strong>
            <br />
            <span className="text-xs tabular-nums">Order #{order?.id?.slice(0, 8)}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {statusSteps.map((step, index) => {
            const completed = index <= currentStatusIndex;
            const current = index === currentStatusIndex;
            return (
              <div
                key={step.status}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg',
                  current && 'bg-primary/5 border border-primary/20',
                  completed && !current && 'opacity-100',
                  !completed && 'opacity-50'
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full shrink-0 transition-colors',
                    completed
                      ? 'bg-positive text-positive-foreground'
                      : 'bg-muted text-muted-foreground',
                    current && 'bg-primary text-primary-foreground'
                  )}
                >
                  {current ? (
                    <span className="h-4 w-4 animate-spin">{Icons.loader}</span>
                  ) : (
                    <span className="h-4 w-4">{Icons.check}</span>
                  )}
                </span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    completed ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Address Modal
const AddressModal = ({ isOpen, onClose, address, onSave, userId }) => {
  const [formData, setFormData] = useState({
    label: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    is_default: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (address) {
      setFormData({
        label: address.label || '',
        address_line1: address.address_line1 || '',
        address_line2: address.address_line2 || '',
        city: address.city || '',
        state: address.state || '',
        zip_code: address.zip_code || '',
        is_default: address.is_default || false,
      });
    } else {
      setFormData({
        label: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        zip_code: '',
        is_default: false,
      });
    }
  }, [address]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (address) {
        await updateAddress(address.id, formData);
      } else {
        await createAddress({ ...formData, user_id: userId });
      }
      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to save address:', err);
      setError(err.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{address ? 'Edit Address' : 'Add New Address'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="addr-label">Label</Label>
            <select
              id="addr-label"
              value={formData.label}
              onChange={e => setFormData({ ...formData, label: e.target.value })}
              required
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select a label</option>
              <option value="Home">Home</option>
              <option value="Work">Work</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="addr-line1">Address Line 1</Label>
            <Input
              id="addr-line1"
              type="text"
              value={formData.address_line1}
              onChange={e => setFormData({ ...formData, address_line1: e.target.value })}
              placeholder="123 Main St"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="addr-line2">Address Line 2 (Optional)</Label>
            <Input
              id="addr-line2"
              type="text"
              value={formData.address_line2}
              onChange={e => setFormData({ ...formData, address_line2: e.target.value })}
              placeholder="Apt, Suite, Unit, etc."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="addr-city">City</Label>
              <Input
                id="addr-city"
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                placeholder="Portland"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:contents">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="addr-state">State</Label>
                <Input
                  id="addr-state"
                  type="text"
                  value={formData.state}
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                  placeholder="OR"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="addr-zip">ZIP Code</Label>
                <Input
                  id="addr-zip"
                  type="text"
                  value={formData.zip_code}
                  onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                  placeholder="97201"
                  required
                />
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_default}
              onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
              className="h-4 w-4 rounded border-input accent-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <span className="text-sm">Set as default address</span>
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : (address ? 'Update Address' : 'Add Address')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Payment Modal
const PaymentModal = ({ isOpen, onClose, payment, onSave, userId }) => {
  const [formData, setFormData] = useState({
    card_type: '',
    last_four: '',
    expiry_month: '',
    expiry_year: '',
    cardholder_name: '',
    is_default: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (payment) {
      setFormData({
        card_type: payment.card_type || '',
        last_four: payment.last_four || '',
        expiry_month: payment.expiry_month || '',
        expiry_year: payment.expiry_year || '',
        cardholder_name: payment.cardholder_name || '',
        is_default: payment.is_default || false,
      });
    } else {
      setFormData({
        card_type: '',
        last_four: '',
        expiry_month: '',
        expiry_year: '',
        cardholder_name: '',
        is_default: false,
      });
    }
  }, [payment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (payment) {
        await updatePaymentMethod(payment.id, formData);
      } else {
        await createPaymentMethod({ ...formData, user_id: userId });
      }
      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to save payment method:', err);
      setError(err.message || 'Failed to save payment method');
    } finally {
      setSaving(false);
    }
  };

  const selectClass = 'h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{payment ? 'Edit Payment Method' : 'Add Payment Method'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-type">Card Type</Label>
            <select
              id="pay-type"
              value={formData.card_type}
              onChange={e => setFormData({ ...formData, card_type: e.target.value })}
              required
              className={selectClass}
            >
              <option value="">Select card type</option>
              <option value="Visa">Visa</option>
              <option value="Mastercard">Mastercard</option>
              <option value="Amex">American Express</option>
              <option value="Discover">Discover</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-name">Cardholder Name</Label>
            <Input
              id="pay-name"
              type="text"
              value={formData.cardholder_name}
              onChange={e => setFormData({ ...formData, cardholder_name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-last4">Last 4 Digits</Label>
            <Input
              id="pay-last4"
              type="text"
              value={formData.last_four}
              onChange={e => setFormData({ ...formData, last_four: e.target.value })}
              placeholder="4242"
              maxLength="4"
              pattern="[0-9]{4}"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pay-month">Expiry Month</Label>
              <select
                id="pay-month"
                value={formData.expiry_month}
                onChange={e => setFormData({ ...formData, expiry_month: parseInt(e.target.value) })}
                required
                className={selectClass}
              >
                <option value="">MM</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {month.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pay-year">Expiry Year</Label>
              <select
                id="pay-year"
                value={formData.expiry_year}
                onChange={e => setFormData({ ...formData, expiry_year: parseInt(e.target.value) })}
                required
                className={selectClass}
              >
                <option value="">YYYY</option>
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_default}
              onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
              className="h-4 w-4 rounded border-input accent-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <span className="text-sm">Set as default payment method</span>
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : (payment ? 'Update Payment' : 'Add Payment')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Edit Profile Modal
const EditProfileModal = ({ isOpen, onClose, profile, onSave }) => {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Change Password Modal
const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (error) throw error;

      setSuccess('Password updated successfully!');
      showToast('Password updated successfully!', 'success');
      setTimeout(() => {
        onClose();
        setFormData({ newPassword: '', confirmPassword: '' });
        setSuccess('');
      }, 2000);
    } catch (err) {
      const errorMsg = err.message || 'Failed to update password';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md border border-positive/30 bg-positive/10 px-3 py-2 text-sm text-positive">
              {success}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={formData.newPassword}
              onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Updating…' : 'Update Password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Main Customer Profile Component
const CustomerProfile = ({ onBack }) => {
  const { profile, loading: authLoading, user, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { addItem, openCart } = useCart();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  // Track window size for responsive header display
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'account');

  // Sync activeTab changes to URL
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    if (tab === 'account') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  }, [setSearchParams]);

  // Data state
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [checkIns, setCheckIns] = useState([]);

  // Loading states
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [loadingCheckIns, setLoadingCheckIns] = useState(true);

  // Modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Handle profile update
  const handleSaveProfile = async (updatedData) => {
    if (!user?.id) return;
    try {
      await updateCustomerProfile(user.id, updatedData);
    } catch (err) {
      showToast('Failed to update profile', 'error');
      throw err;
    }
    showToast('Profile updated successfully', 'success');
    // Refresh profile data (AuthContext will handle this automatically)
    window.location.reload(); // Simple refresh for now
  };

  // Handle order actions
  const handleReorder = async (order) => {
    if (!order.items || order.items.length === 0) {
      showToast('No items found for this order', 'error');
      return;
    }
    const truck = { id: order.truck_id, name: order.truck_name };
    for (const item of order.items) {
      await addItem(
        { id: item.menu_item_id, name: item.name, price: parseFloat(item.price) },
        truck
      );
    }
    showToast(`${order.items.length} item(s) added to cart`, 'success');
    openCart();
  };

  const handleReview = (order) => {
    setSelectedOrder(order);
    setShowReviewModal(true);
  };

  const handleTrackOrder = (order) => {
    setSelectedOrder(order);
    setShowTrackModal(true);
  };

  const handleSubmitReview = async ({ rating, comment, orderId, truckId }) => {
    try {
      await submitOrderReview({
        truckId,
        customerId: user.id,
        orderId,
        rating,
        comment,
      });
      fetchOrders();
      showToast('Thank you for your review!', 'success');
    } catch (err) {
      console.error('Error submitting review:', err);
      showToast('Failed to submit review', 'error');
      throw err;
    }
  };

  // Fetch customer orders
  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    setLoadingOrders(true);
    try {
      setOrders(await fetchCustomerOrdersDetailed(user.id));
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [user?.id]);

  // Fetch customer favorites
  const fetchFavorites = useCallback(async () => {
    if (!user?.id) return;
    setLoadingFavorites(true);
    try {
      setFavorites(await fetchFavoriteTrucksWithRatings(user.id));
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setLoadingFavorites(false);
    }
  }, [user?.id]);

  // Fetch check-ins for punch cards
  const fetchCheckIns = useCallback(async () => {
    if (!user?.id) return;
    setLoadingCheckIns(true);
    try {
      setCheckIns(await fetchUserCheckIns(user.id));
    } catch (err) {
      console.error('Error fetching check-ins:', err);
    } finally {
      setLoadingCheckIns(false);
    }
  }, [user?.id]);

  // Claim punch card reward
  const handleClaimReward = async (truckId) => {
    try {
      const data = await claimPunchCardReward(user.id, truckId);
      if (data?.success) {
        showToast(`${data.message} +${data.points_awarded} points!`, 'success');
        fetchCheckIns();
        // Refresh profile to update points display
        window.location.reload();
      } else {
        showToast(data?.message || 'Not enough punches yet', 'info');
      }
    } catch (err) {
      console.error('Error claiming reward:', err);
      showToast('Failed to claim reward. Please try again.', 'error');
    }
  };

  // Remove from favorites
  const handleRemoveFavorite = async (truckId) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('customer_id', user.id)
        .eq('truck_id', truckId);

      if (error) throw error;
      setFavorites(prev => prev.filter(f => f.id !== truckId));
      showToast('Removed from favorites', 'info');
    } catch (err) {
      console.error('Error removing favorite:', err);
      showToast('Failed to remove favorite', 'error');
    }
  };

  // Fetch data on mount
  useEffect(() => {
    if (user?.id) {
      fetchOrders();
      fetchFavorites();
      fetchCheckIns();
    }
  }, [user?.id, fetchOrders, fetchFavorites, fetchCheckIns]);

  // Real-time subscription for order status updates
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('customer-orders')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`,
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
  }, [user?.id]);

  if (authLoading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  // Handle case where profile doesn't exist (e.g., admin without profile record)
  if (!profile && user) {
    const showFallbackHeader = isMobile || onBack;
    return (
      <div className="customer-profile">
        {showFallbackHeader && (
          <header className="main-profile-header">
            {onBack ? (
              <button className="back-button" onClick={onBack}>
                {Icons.chevronLeft}
              </button>
            ) : (
              <div className="header-spacer"></div>
            )}
            <h1>Account</h1>
            <div className="header-spacer"></div>
          </header>
        )}
        <div className="profile-content">
          <div className="profile-hero">
            <div className="profile-avatar-large">
              {user.email?.charAt(0).toUpperCase() || '?'}
            </div>
            <h2 className="profile-name">{user.user_metadata?.name || 'User'}</h2>
            <p className="profile-email">{user.email}</p>
          </div>
          <div className="profile-notice">
            <p>Your profile is being set up. Some features may be limited.</p>
          </div>
          <button className="logout-button" onClick={async () => {
            try {
              await signOut();
            } catch (err) {
              console.error('Logout failed:', err);
            }
          }}>
            {Icons.logout}
            <span>Log Out</span>
          </button>
        </div>
      </div>
    );
  }

  const handleTabBack = () => handleTabChange('account');

  const renderTab = () => {
    switch (activeTab) {
      case 'account':
        return (
          <AccountTab
            profile={profile}
            setActiveTab={handleTabChange}
            ordersCount={orders.length}
            favoritesCount={favorites.length}
            onEditProfile={() => setShowEditProfile(true)}
            showDesktopTitle={!isMobile && !onBack}
          />
        );
      case 'orders':
        return (
          <OrdersTab
            onBack={handleTabBack}
            orders={orders}
            loading={loadingOrders}
            onReview={handleReview}
            onTrack={handleTrackOrder}
            onReorder={handleReorder}
          />
        );
      case 'favorites':
        return (
          <FavoritesTab
            onBack={handleTabBack}
            favorites={favorites}
            loading={loadingFavorites}
            onRemoveFavorite={handleRemoveFavorite}
            onViewMenu={(truckId) => navigate(`/truck/${truckId}`)}
          />
        );
      case 'rewards':
        return (
          <RewardsTab
            onBack={handleTabBack}
            points={profile?.points}
            checkIns={checkIns}
            loading={loadingCheckIns}
            onClaimReward={handleClaimReward}
          />
        );
      case 'addresses':
        return <AddressesTab onBack={handleTabBack} userId={user?.id} />;
      case 'payment':
        return <PaymentTab onBack={handleTabBack} userId={user?.id} />;
      case 'notifications':
        return <NotificationsTab onBack={handleTabBack} />;
      case 'security':
        return <SecurityTab onBack={handleTabBack} onChangePassword={() => setShowChangePassword(true)} />;
      case 'help':
        return <HelpTab onBack={handleTabBack} />;
      default:
        return (
          <AccountTab
            profile={profile}
            setActiveTab={handleTabChange}
            ordersCount={orders.length}
            favoritesCount={favorites.length}
            onEditProfile={() => setShowEditProfile(true)}
            showDesktopTitle={!isMobile && !onBack}
          />
        );
    }
  };

  // Show main header only on mobile when using AppLayout (no onBack provided on desktop)
  const showMainHeader = activeTab === 'account' && (isMobile || onBack);
  const showDesktopShell = !isMobile && !onBack;

  // Sidebar nav for desktop. Mirrors the AccountTab menu list so customers
  // see the same options whether they navigate via the sidebar or via the
  // mobile menu-list-as-home pattern.
  const sidebarNavItems = [
    { id: 'account', label: 'Account', icon: Icons.user },
    {
      id: 'orders',
      label: 'Order History',
      icon: Icons.orders,
      badge: orders.length > 0 ? orders.length : null,
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: Icons.heart,
      badge: favorites.length > 0 ? favorites.length : null,
    },
    {
      id: 'rewards',
      label: 'Rewards',
      icon: Icons.gift,
      badge: profile?.points ? `${profile.points} pts` : null,
    },
    { id: 'addresses', label: 'Addresses', icon: Icons.mapPin },
    { id: 'payment', label: 'Payment', icon: Icons.creditCard },
    { id: 'notifications', label: 'Notifications', icon: Icons.bell },
    { id: 'security', label: 'Security', icon: Icons.shield },
    { id: 'help', label: 'Help', icon: Icons.help },
  ];

  const sidebarBrand = (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-sm">
        {profile?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-bold tracking-tight leading-tight truncate">
          {profile?.name || 'My Account'}
        </h2>
        <p className="text-[11px] text-muted-foreground truncate">{profile?.email || user?.email}</p>
      </div>
    </div>
  );

  const modals = (
    <>
      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        order={selectedOrder}
        onSubmit={handleSubmitReview}
      />
      <TrackOrderModal
        isOpen={showTrackModal}
        onClose={() => setShowTrackModal(false)}
        order={selectedOrder}
      />
    </>
  );

  if (showDesktopShell) {
    return (
      <div className="customer-profile">
        <DashboardShell
          sidebar={
            <DashboardSidebar
              brand={sidebarBrand}
              navItems={sidebarNavItems}
              activeId={activeTab}
              onNavigate={handleTabChange}
            />
          }
        >
          {renderTab()}
        </DashboardShell>
        {modals}
      </div>
    );
  }

  return (
    <div className="customer-profile">
      {showMainHeader && (
        <header className="main-profile-header">
          {onBack ? (
            <button className="back-button" onClick={onBack}>
              {Icons.chevronLeft}
            </button>
          ) : (
            <div className="header-spacer"></div>
          )}
          <h1>Account</h1>
          <button className="settings-button" onClick={() => handleTabChange('notifications')}>
            {Icons.bell}
          </button>
        </header>
      )}
      {renderTab()}
      {modals}
    </div>
  );
};

export default CustomerProfile;
