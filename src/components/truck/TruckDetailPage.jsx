import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { useTrucks } from '../../contexts/TruckContext';
import { fetchMenuItems } from '../../services/menu';
import { fetchTruckReviews, fetchUserTruckReview, fetchUserMenuItemRating } from '../../services/reviews';
import {
  hasCompletedOrderForTruck,
  fetchOrderedMenuItemIdsForTruck,
} from '../../services/orders';
import { fetchTruckRatingSummary } from '../../services/trucks';
import { Icons } from '../common/Icons';
import { formatRelativeTime, formatTruckHours } from '../../utils/formatters';
import ReviewModal from '../reviews/ReviewModal';
import MenuItemRatingModal from '../reviews/MenuItemRatingModal';
import SidebarCart from '../cart/SidebarCart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import LoadingSplash from '../common/LoadingSplash';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TruckDetailPage = () => {
  const params = useParams();
  const idOrSlug = params.id || params.slug;
  const isSlugRoute = !!params.slug;
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, devSettings } = useAuth();
  const { addItem, openCart, itemCount } = useCart();
  const { showToast } = useToast();
  const { isFavorite, toggleFavorite: toggleFavoriteContext } = useFavorites();
  const { track } = useAnalytics();
  const { loadTruckById, loadTruckBySlug } = useTrucks();

  const [truck, setTruck] = useState(location.state?.truck || null);
  const id = truck?.id || (UUID_RE.test(idOrSlug || '') ? idOrSlug : null);
  const [menuItems, setMenuItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(!location.state?.truck);
  const [addedItem, setAddedItem] = useState(null);

  const [activeCategory, setActiveCategory] = useState('all');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [showItemRatingModal, setShowItemRatingModal] = useState(false);
  const [selectedItemForRating, setSelectedItemForRating] = useState(null);
  const [existingItemRating, setExistingItemRating] = useState(null);
  const [orderedItemIds, setOrderedItemIds] = useState([]);

  const featuredScrollRef = useRef(null);

  const handleSignOut = async () => {
    try {
      navigate('/', { replace: true });
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  useEffect(() => {
    const fetchTruck = async () => {
      if (truck) {
        setLoading(false);
        return;
      }

      try {
        let resolved = null;

        if (isSlugRoute) {
          resolved = await loadTruckBySlug(idOrSlug);
          if (resolved && resolved.slug && resolved.slug !== idOrSlug) {
            navigate(`/t/${resolved.slug}`, { replace: true });
            return;
          }
        } else if (UUID_RE.test(idOrSlug)) {
          resolved = await loadTruckById(idOrSlug);
        } else {
          resolved = await loadTruckBySlug(idOrSlug);
          if (resolved) {
            navigate(`/t/${resolved.slug || resolved.id}`, { replace: true });
            return;
          }
        }

        if (!resolved) throw new Error('Truck not found');
        setTruck(resolved);
      } catch (err) {
        console.error('Error fetching truck:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTruck();
  }, [idOrSlug, isSlugRoute, truck, loadTruckById, loadTruckBySlug, navigate]);

  useEffect(() => {
    if (!id) return;
    const fetchMenu = async () => {
      try {
        const items = await fetchMenuItems(id);
        setMenuItems(items);
      } catch (err) {
        console.error('Error fetching menu:', err);
      }
    };
    fetchMenu();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchReviews = async () => {
      try {
        const list = await fetchTruckReviews(id, { limit: 5 });
        setReviews(list);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }
    };
    fetchReviews();
  }, [id]);

  useEffect(() => {
    if (!user || !id) {
      setCanReview(false);
      setExistingReview(null);
      return;
    }
    const checkReviewEligibility = async () => {
      try {
        const completed = await hasCompletedOrderForTruck(id, user.id);
        setCanReview(completed);
        if (completed) {
          const review = await fetchUserTruckReview(id, user.id).catch(() => null);
          setExistingReview(review || null);
        }
      } catch (err) {
        console.error('Error checking review eligibility:', err);
      }
    };
    checkReviewEligibility();
  }, [user, id]);

  useEffect(() => {
    if (!user || !id) {
      setOrderedItemIds([]);
      return;
    }
    const fetchOrdered = async () => {
      try {
        const items = await fetchOrderedMenuItemIdsForTruck(id, user.id);
        setOrderedItemIds(items);
      } catch (err) {
        console.error('Error fetching ordered items:', err);
      }
    };
    fetchOrdered();
  }, [user, id]);

  useEffect(() => {
    if (truck && id) {
      track('truck_viewed', { truck_id: id, truck_name: truck.name });
    }
  }, [truck, id, track]);

  const handleToggleFavorite = async () => {
    if (!user) {
      showToast('Sign in to save favorites', 'info');
      navigate('/eat');
      return;
    }
    await toggleFavoriteContext(id);
  };

  const handleAddToCart = (item) => {
    if (truck && !truck.acceptingOrders) {
      showToast('This truck is not accepting orders right now', 'error');
      return;
    }
    const cartItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      emoji: item.emoji || '🍽️',
    };

    const truckData = { id: truck.id, name: truck.name };

    const success = addItem(cartItem, truckData);
    if (success) {
      setAddedItem(item.id);
      setTimeout(() => setAddedItem(null), 1500);
    }
  };

  const handleBack = () => navigate(-1);

  const handleGetDirections = () => {
    const address = encodeURIComponent(truck.location || 'Portland, OR');
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  const handleShare = async () => {
    const shareData = {
      title: truck.name,
      text: `Check out ${truck.name} on Cravrr!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!', 'success');
    }
  };

  const scrollFeatured = (direction) => {
    if (featuredScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      featuredScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleOpenReviewModal = () => {
    if (!user) { navigate('/eat'); return; }
    setShowReviewModal(true);
  };

  const handleOpenItemRating = async (item) => {
    if (!user) { navigate('/eat'); return; }
    const existingRating = await fetchUserMenuItemRating(item.id, user.id).catch(() => null);
    setSelectedItemForRating(item);
    setExistingItemRating(existingRating || null);
    setShowItemRatingModal(true);
  };

  const handleReviewSuccess = async () => {
    try {
      const list = await fetchTruckReviews(id, { limit: 5 });
      setReviews(list);
      const truckRating = await fetchTruckRatingSummary(id);
      if (truckRating && truck) {
        setTruck({ ...truck, rating: truckRating.rating, reviewCount: truckRating.review_count });
      }
      const review = await fetchUserTruckReview(id, user.id);
      setExistingReview(review || null);
    } catch (err) {
      console.error('Refresh after review failed:', err);
    }
  };

  const handleItemRatingSuccess = async () => {
    try {
      const items = await fetchMenuItems(id);
      setMenuItems(items);
    } catch (err) {
      console.error('Error refreshing menu items after rating:', err);
    }
  };

  if (loading) {
    return <LoadingSplash />;
  }

  if (!truck) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">Truck not found</h2>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const features = Array.isArray(truck.features) ? truck.features : [];
  const deals = truck.promotions || [];
  const featuredItems = menuItems.filter(item => item.popular || item.featured);
  const categories = ['all', ...new Set(menuItems.filter(item => item.category).map(item => item.category))];

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = !menuSearchQuery ||
      item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(menuSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const navItem = "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Sidebar (desktop only) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-border lg:bg-card">
        <div
          className="flex h-16 items-center px-5 border-b border-border cursor-pointer"
          onClick={() => navigate('/')}
        >
          <img src="/logo/cravvr-logo.png" alt="Cravrr" className="h-9 w-auto" />
        </div>

        <nav className="flex flex-col gap-1 p-3">
          <button className={navItem} onClick={() => navigate('/')}>
            <span className="h-5 w-5 shrink-0">{Icons.home}</span>
            <span>Home</span>
          </button>
          <button className={navItem} onClick={() => navigate('/favorites')}>
            <span className="h-5 w-5 shrink-0">{Icons.heart}</span>
            <span>Favorites</span>
          </button>
          <button className={navItem} onClick={() => navigate('/orders')}>
            <span className="h-5 w-5 shrink-0">{Icons.orders}</span>
            <span>Orders</span>
          </button>
        </nav>

        <div className="mx-3 my-2 border-t border-border" />

        <nav className="flex flex-col gap-1 p-3">
          {user ? (
            <>
              <button className={navItem} onClick={() => navigate('/profile')}>
                <span className="h-5 w-5 shrink-0">{Icons.user}</span>
                <span>Account</span>
              </button>
              <button
                className={cn(navItem, 'text-destructive hover:bg-destructive/10 hover:text-destructive')}
                onClick={handleSignOut}
              >
                <span className="h-5 w-5 shrink-0">{Icons.logOut}</span>
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <button className={cn(navItem, 'text-primary')} onClick={() => navigate('/eat')}>
              <span className="h-5 w-5 shrink-0">{Icons.user}</span>
              <span>Sign In</span>
            </button>
          )}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex">
        <div className="flex-1 min-w-0">
          {/* Sticky Header */}
          <div className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/85 backdrop-blur px-4">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back"
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
            >
              <span className="h-5 w-5">{Icons.chevronLeft}</span>
            </button>
            <div className="flex-1 truncate text-center text-sm font-semibold">
              {truck.name}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleFavorite}
                aria-label={isFavorite(id) ? 'Remove from favorites' : 'Add to favorites'}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                  isFavorite(id)
                    ? 'text-primary bg-primary/10 hover:bg-primary/15'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <span className="h-5 w-5">{isFavorite(id) ? Icons.heartFilled : Icons.heart}</span>
              </button>
              <button
                type="button"
                onClick={openCart}
                aria-label="Open cart"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
              >
                <span className="h-5 w-5">{Icons.shoppingBag}</span>
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground tabular-nums">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Hero — no overflow-hidden so the avatar (which uses -bottom-10
              to hang into the body) renders fully. object-cover on the img
              itself keeps the cover photo cropped to the aspect frame. */}
          <div className="relative aspect-[16/9] w-full bg-muted sm:aspect-[21/9] lg:aspect-[5/2]">
            <img
              src={truck.coverImage || truck.image}
              alt={truck.name}
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => {
                if (e.target.src !== truck.image) {
                  e.target.src = truck.image;
                } else {
                  e.target.src = 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80';
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {truck.featured && (
              <div className="absolute top-4 left-4 inline-flex items-center gap-1 rounded-full bg-warning/95 px-3 py-1 text-xs font-bold uppercase tracking-wide text-warning-foreground shadow-md">
                <span className="h-3 w-3">{Icons.star}</span>
                Featured
              </div>
            )}
            {truck.prepTime && (
              <div className="absolute top-4 right-4 inline-flex items-center rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                {truck.prepTime}
              </div>
            )}
            <div className="absolute -bottom-10 left-6 h-20 w-20 overflow-hidden rounded-2xl border-4 border-background bg-background shadow-lg sm:h-24 sm:w-24">
              <img
                src={truck.logoUrl || truck.image}
                alt={`${truck.name} logo`}
                className="h-full w-full object-cover"
                onError={(e) => { e.target.src = truck.image; }}
              />
            </div>
          </div>

          {/* Body */}
          <div className="px-4 sm:px-6 lg:px-10 pt-14 pb-10 max-w-4xl">
            {/* Title section */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  {truck.name}
                  {truck.verified && (
                    <span className="h-5 w-5 text-info" title="Verified by Cravvr" aria-label="Verified">
                      {Icons.checkCircle || Icons.check}
                    </span>
                  )}
                </h1>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm">
                  <span className="h-4 w-4 text-warning">{Icons.star}</span>
                  <span className="font-bold tabular-nums">{truck.rating || 4.5}</span>
                  <span className="text-muted-foreground">({truck.reviewCount || 0})</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {truck.cuisine || 'Food Truck'} • {truck.priceRange || '$$'}
              </p>
              <p className="text-sm leading-relaxed text-foreground/80">
                {truck.description || 'Delicious food made fresh daily. Visit us to discover our amazing menu!'}
              </p>
            </div>

            {/* Not accepting banner */}
            {truck.isOpen && !truck.acceptingOrders && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                <span className="h-4 w-4 shrink-0">{Icons.clock}</span>
                This truck is not accepting orders right now. Check back shortly!
              </div>
            )}

            {/* Info strip */}
            <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="h-3.5 w-3.5 text-warning">{Icons.star}</span>
                {truck.rating || 4.5} ({truck.reviewCount || 0} ratings)
              </span>
              <span aria-hidden="true">·</span>
              <span>{truck.distance || '1.0 mi'}</span>
              <span aria-hidden="true">·</span>
              <span>{truck.priceRange || '$$'}</span>
              <span aria-hidden="true">·</span>
              <span
                className={cn(
                  'font-semibold',
                  truck.isOpen !== false ? 'text-positive' : 'text-destructive'
                )}
              >
                {truck.isOpen !== false ? 'Open Now' : 'Closed'}
              </span>
              {truck.prepTime && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{truck.prepTime}</span>
                </>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <button
                type="button"
                onClick={handleGetDirections}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
              >
                <span className="h-4 w-4">{Icons.mapPin}</span>
                {truck.location || 'Portland, OR'}
              </button>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-4 w-4">{Icons.clock}</span>
                {truck.hours || '11am - 9pm'}
              </span>
            </div>

            {/* Deals */}
            {deals.length > 0 && (
              <section className="mt-8">
                <h3 className="text-lg font-bold tracking-tight">Deals & Benefits</h3>
                <div className="mt-3 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 flex gap-3 overflow-x-auto pb-2">
                  {deals.map(deal => (
                    <Card
                      key={deal.id}
                      className="shrink-0 w-72 border-primary/20 bg-primary/5"
                    >
                      <CardContent className="p-4 flex gap-3">
                        <span className="text-3xl shrink-0 leading-none">{deal.emoji}</span>
                        <div className="min-w-0 space-y-1">
                          <h4 className="font-semibold text-sm">{deal.title}</h4>
                          <p className="text-xs text-muted-foreground">{deal.description}</p>
                          {deal.code && (
                            <Badge variant="outline" className="font-mono">{deal.code}</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Featured items */}
            {featuredItems.length > 0 && (
              <section className="mt-8">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold tracking-tight">Featured Items</h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => scrollFeatured('left')}
                      aria-label="Scroll left"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <span className="h-4 w-4">{Icons.chevronLeft}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollFeatured('right')}
                      aria-label="Scroll right"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <span className="h-4 w-4">{Icons.chevronRight}</span>
                    </button>
                  </div>
                </div>
                <div
                  ref={featuredScrollRef}
                  className="mt-3 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 flex gap-3 overflow-x-auto pb-2"
                >
                  {featuredItems.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      className="group shrink-0 w-44 text-left"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted ring-1 ring-black/5 shadow-sm transition-shadow group-hover:shadow-md">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                        <span className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-foreground shadow-md transition-transform group-hover:scale-110">
                          +
                        </span>
                      </div>
                      <div className="mt-2 px-1">
                        <h4 className="font-semibold text-sm leading-tight truncate">{item.name}</h4>
                        <span className="text-sm font-bold tabular-nums text-primary">
                          {item.priceFormatted}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Features */}
            {features.length > 0 && (
              <section className="mt-8">
                <h3 className="text-lg font-bold tracking-tight">Features & Dietary</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground"
                    >
                      <span className="h-3.5 w-3.5 text-positive">{Icons.check}</span>
                      {feature}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Menu */}
            <section className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold tracking-tight">Menu</h3>
                <span className="text-xs text-muted-foreground">
                  {filteredMenuItems.length} {filteredMenuItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="relative mt-3">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
                  {Icons.search}
                </span>
                <input
                  type="text"
                  placeholder={`Search ${truck.name}'s menu…`}
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                {menuSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setMenuSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <span className="h-3.5 w-3.5">{Icons.x}</span>
                  </button>
                )}
              </div>

              {categories.length > 1 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {categories.map(cat => {
                    const isActive = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                          'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          isActive
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        )}
                      >
                        {cat === 'all' ? 'All' : cat}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-3">
                {filteredMenuItems.length === 0 ? (
                  menuItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                      <span className="text-3xl">📋</span>
                      <p className="font-semibold text-foreground">Menu not available yet</p>
                      <p className="text-xs">This truck hasn't added their menu items yet. Check back soon!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-sm text-muted-foreground">
                      <span className="text-3xl">🔍</span>
                      <p className="font-semibold text-foreground">No items match your search</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setMenuSearchQuery(''); setActiveCategory('all'); }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  )
                ) : (
                  filteredMenuItems.map(item => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="flex items-stretch gap-4 p-3 sm:p-4">
                        <div className="flex-1 min-w-0 flex flex-col">
                          <h4 className="font-bold text-sm leading-tight">{item.name}</h4>
                          {item.description && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-snug">
                              {item.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-3 text-sm">
                            <span className="font-bold tabular-nums text-primary">
                              {item.priceFormatted}
                            </span>
                            {item.averageRating > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <span className="h-3 w-3 text-warning">{Icons.star}</span>
                                {item.averageRating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={addedItem === item.id ? 'default' : 'outline'}
                              onClick={() => handleAddToCart(item)}
                              className={cn(
                                'gap-1.5',
                                addedItem === item.id && 'bg-positive text-positive-foreground hover:bg-positive/90'
                              )}
                            >
                              {addedItem === item.id ? (
                                <>
                                  Added
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                </>
                              ) : (
                                <>
                                  Add
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                  </svg>
                                </>
                              )}
                            </Button>
                            {orderedItemIds.includes(item.id) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenItemRating(item)}
                                title="Rate this item"
                                className="h-8 w-8 p-0"
                              >
                                <span className="h-4 w-4 text-warning">{Icons.star}</span>
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-black/5">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                          {item.popular && (
                            <span className="absolute top-1.5 left-1.5 rounded-full bg-warning px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning-foreground shadow">
                              Popular
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </section>

            {/* Reviews */}
            <section className="mt-10">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold tracking-tight">
                  Reviews ({truck.reviewCount || reviews.length})
                </h3>
                {canReview && (
                  <Button size="sm" onClick={handleOpenReviewModal} className="gap-1.5">
                    <span className="h-4 w-4">{Icons.star}</span>
                    {existingReview ? 'Edit Review' : 'Write a Review'}
                  </Button>
                )}
              </div>

              {!canReview && user && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  <span>🛒</span>
                  Complete an order to leave a review
                </div>
              )}

              {reviews.length === 0 ? (
                <div className="mt-3 flex flex-col items-center justify-center gap-3 py-12 text-center text-sm text-muted-foreground">
                  <span className="text-3xl">📝</span>
                  <p className="font-semibold text-foreground">
                    No reviews yet. {canReview ? 'Be the first to review!' : 'Order to be the first reviewer!'}
                  </p>
                  {canReview && (
                    <Button onClick={handleOpenReviewModal}>
                      Write a Review
                    </Button>
                  )}
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-3">
                  {reviews.map(review => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                              {review.customerName?.charAt(0) || 'C'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm truncate">
                                {review.customerName || 'Customer'}
                              </div>
                              <div className="flex items-center gap-0.5 text-warning mt-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className="h-3.5 w-3.5">
                                    {i < review.rating ? Icons.star : Icons.starOutline}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                            {formatRelativeTime(review.createdAt)}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                            {review.comment}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* CTA */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleGetDirections} className="gap-2">
                <span className="h-4 w-4">{Icons.mapPin}</span>
                Get Directions
              </Button>
              <Button variant="outline" onClick={handleShare} className="gap-2">
                <span className="h-4 w-4">{Icons.share}</span>
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Right Cart Sidebar (desktop only) */}
        <div className="hidden xl:block xl:w-80 xl:shrink-0 xl:border-l xl:border-border xl:sticky xl:top-0 xl:h-screen xl:overflow-y-auto">
          <SidebarCart />
        </div>
      </div>

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        truck={truck}
        userId={user?.id}
        existingReview={existingReview}
        onSuccess={handleReviewSuccess}
      />

      <MenuItemRatingModal
        isOpen={showItemRatingModal}
        onClose={() => {
          setShowItemRatingModal(false);
          setSelectedItemForRating(null);
          setExistingItemRating(null);
        }}
        item={selectedItemForRating}
        userId={user?.id}
        existingRating={existingItemRating}
        onSuccess={handleItemRatingSuccess}
      />
    </div>
  );
};

export default TruckDetailPage;
