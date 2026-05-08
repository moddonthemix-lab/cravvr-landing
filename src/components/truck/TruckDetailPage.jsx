import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { useTrucks } from '../../contexts/TruckContext';
import { supabase } from '../../lib/supabase';
import { fetchMenuItems } from '../../services/menu';
import { fetchTruckReviews } from '../../services/reviews';
import { Icons } from '../common/Icons';
import { formatRelativeTime, formatTruckHours } from '../../utils/formatters';
import ReviewModal from '../reviews/ReviewModal';
import MenuItemRatingModal from '../reviews/MenuItemRatingModal';
import SidebarCart from '../cart/SidebarCart';

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

  // Core state
  const [truck, setTruck] = useState(location.state?.truck || null);
  // Aliased for legacy callsites that fetch by truck id (favorites, menu, reviews).
  // Prefers the resolved truck's UUID; falls back to URL param if it's a UUID.
  const id = truck?.id || (UUID_RE.test(idOrSlug || '') ? idOrSlug : null);
  const [menuItems, setMenuItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(!location.state?.truck);
  const [addedItem, setAddedItem] = useState(null);

  // New feature state

  const [activeCategory, setActiveCategory] = useState('all');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');

  // Review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [showItemRatingModal, setShowItemRatingModal] = useState(false);
  const [selectedItemForRating, setSelectedItemForRating] = useState(null);
  const [existingItemRating, setExistingItemRating] = useState(null);
  const [orderedItemIds, setOrderedItemIds] = useState([]);

  // Refs for scrolling
  const featuredScrollRef = useRef(null);

  // Handle sign out with navigation
  const handleSignOut = async () => {
    try {
      navigate('/', { replace: true });
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  // Fetch truck data if not passed via state. Routes through TruckContext so
  // the cache + canonical transformTruck shape are shared with the rest of
  // the app — no parallel fetch path, no second truck shape to drift.
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
          // Canonicalizing redirect when visited via an old slug.
          if (resolved && resolved.slug && resolved.slug !== idOrSlug) {
            navigate(`/t/${resolved.slug}`, { replace: true });
            return;
          }
        } else if (UUID_RE.test(idOrSlug)) {
          resolved = await loadTruckById(idOrSlug);
        } else {
          // Legacy /truck/:non-uuid — treat as slug and canonicalize.
          resolved = await loadTruckBySlug(idOrSlug);
          if (resolved) {
            navigate(`/t/${resolved.slug || resolved.id}`, { replace: true });
            return;
          }
        }

        if (resolved) {
          setTruck(resolved);
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error('Error fetching truck:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchTruck();
  }, [idOrSlug, isSlugRoute, truck, navigate, loadTruckById, loadTruckBySlug]);

  // Fire view_truck once the truck is resolved (handles both state-passed and fetched cases).
  const trackedTruckId = useRef(null);
  useEffect(() => {
    if (!truck?.id || trackedTruckId.current === truck.id) return;
    trackedTruckId.current = truck.id;
    track('view_truck', {
      truck_id: truck.id,
      truck_name: truck.name,
      cuisine: truck.cuisine,
    });
  }, [truck?.id, truck?.name, truck?.cuisine, track]);

  // Fetch menu items via the shared service so the menu shape is canonical.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchMenuItems(id);
        if (!cancelled) setMenuItems(items);
      } catch (err) {
        console.error('Error fetching menu items:', err);
        if (!cancelled) setMenuItems([]);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Fetch reviews via the shared service so reviewer-name resolution lives in
  // one place (matters because of the new RLS in 041 — names come through
  // the customers→profiles join).
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchTruckReviews(id, { limit: 5 });
        if (!cancelled) setReviews(list);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Favorite status is now handled by FavoritesContext
  // No need for local state management

  // Check if user can review (has completed order from this truck, or dev setting enabled)
  useEffect(() => {
    const checkReviewEligibility = async () => {
      if (!user || !id) {
        setCanReview(false);
        return;
      }

      // Dev setting: skip order requirement for reviews
      if (devSettings?.skipReviewOrderRequirement) {
        setCanReview(true);
      } else {
        // Check for completed orders
        const { data: orders } = await supabase
          .from('orders')
          .select('id')
          .eq('truck_id', id)
          .eq('customer_id', user.id)
          .eq('status', 'completed')
          .limit(1);

        setCanReview(orders && orders.length > 0);
      }

      // Check for existing review
      const { data: review } = await supabase
        .from('reviews')
        .select('*')
        .eq('truck_id', id)
        .eq('customer_id', user.id)
        .single();

      if (review) {
        setExistingReview(review);
      }

      // Get ordered menu items for this truck
      const { data: orderedItems } = await supabase
        .from('order_items')
        .select('menu_item_id, orders!inner(customer_id, truck_id, status)')
        .eq('orders.truck_id', id)
        .eq('orders.customer_id', user.id)
        .eq('orders.status', 'completed');

      if (orderedItems) {
        const itemIds = [...new Set(orderedItems.map(o => o.menu_item_id))];
        setOrderedItemIds(itemIds);
      }
    };

    checkReviewEligibility();
  }, [user, id, devSettings?.skipReviewOrderRequirement]);

  const handleToggleFavorite = async () => {
    if (!user) {
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

    const truckData = {
      id: truck.id,
      name: truck.name,
    };

    const success = addItem(cartItem, truckData);
    if (success) {
      setAddedItem(item.id);
      setTimeout(() => setAddedItem(null), 1500);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

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
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled share or share API unavailable
      }
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
    if (!user) {
      navigate('/eat');
      return;
    }
    setShowReviewModal(true);
  };

  const handleOpenItemRating = async (item) => {
    if (!user) {
      navigate('/eat');
      return;
    }

    // Check for existing rating
    const { data: existingRating } = await supabase
      .from('menu_item_reviews')
      .select('*')
      .eq('menu_item_id', item.id)
      .eq('customer_id', user.id)
      .single();

    setSelectedItemForRating(item);
    setExistingItemRating(existingRating || null);
    setShowItemRatingModal(true);
  };

  const handleReviewSuccess = async () => {
    // Refresh reviews
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('truck_id', id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) setReviews(data);

    // Refresh truck data for updated rating
    const { data: truckData } = await supabase
      .from('food_trucks')
      .select('rating, review_count')
      .eq('id', id)
      .single();

    if (truckData && truck) {
      setTruck({ ...truck, rating: truckData.rating, reviewCount: truckData.review_count });
    }

    // Update existing review state
    const { data: review } = await supabase
      .from('reviews')
      .select('*')
      .eq('truck_id', id)
      .eq('customer_id', user.id)
      .single();

    setExistingReview(review || null);
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
    return (
      <div className="app-view truck-detail-view-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#e11d48', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="app-view truck-detail-view-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Truck not found</h2>
          <button onClick={() => navigate('/')} style={{ marginTop: '16px', padding: '12px 24px', background: '#e11d48', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Derived data
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

  return (
    <div className="truck-detail-page">
      {/* Left Sidebar */}
      <aside className="truck-detail-sidebar">
        <div className="sidebar-logo" onClick={() => navigate('/')}>
          <img src="/logo/cravvr-logo.png" alt="Cravrr" />
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/')}>
            {Icons.home}
            <span>Home</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/favorites')}>
            {Icons.heart}
            <span>Favorites</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/orders')}>
            {Icons.orders}
            <span>Orders</span>
          </button>
        </nav>

        <div className="sidebar-divider" />

        <nav className="sidebar-nav">
          {user ? (
            <>
              <button className="nav-item" onClick={() => navigate('/profile')}>
                {Icons.user}
                <span>Account</span>
              </button>
              <button className="nav-item signout" onClick={handleSignOut}>
                {Icons.logOut}
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <button className="nav-item signin" onClick={() => navigate('/eat')}>
              {Icons.user}
              <span>Sign In</span>
            </button>
          )}
        </nav>

      </aside>

      {/* Main Content */}
      <div className="truck-detail-main">
        <div className="app-view truck-detail-view-img">
          {/* Sticky Header */}
          <div className="detail-header-img">
            <button className="detail-back-btn" onClick={handleBack}>
              {Icons.chevronLeft}
            </button>
            <div className="detail-header-title">
              <span>{truck.name}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`detail-fav-btn ${isFavorite(id) ? 'active' : ''}`}
                onClick={handleToggleFavorite}
              >
                {isFavorite(id) ? Icons.heartFilled : Icons.heart}
              </button>
              <button
                className="detail-fav-btn"
                onClick={openCart}
                style={{ position: 'relative' }}
              >
                {Icons.shoppingBag}
                {itemCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '18px',
                    height: '18px',
                    background: '#e11d48',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>{itemCount}</span>
                )}
              </button>
            </div>
          </div>

          {/* Hero Image Section with Logo Overlay */}
      <div className="truck-detail-hero-img">
        <img
          src={truck.coverImage || truck.image}
          alt={truck.name}
          className="hero-cover-image"
          onError={(e) => {
            if (e.target.src !== truck.image) {
              e.target.src = truck.image;
            } else {
              e.target.src = 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80';
            }
          }}
        />
        <div className="hero-image-overlay"></div>
        {truck.featured && (
          <div className="hero-featured-badge">
            <span>{Icons.star}</span>
            Featured
          </div>
        )}
        {truck.prepTime && (
          <div className="hero-prep-badge">
            <span>{truck.prepTime}</span>
          </div>
        )}
        {/* Logo Overlay */}
        <div className="store-logo-overlay">
          <img
            src={truck.logoUrl || truck.image}
            alt={`${truck.name} logo`}
            onError={(e) => { e.target.src = truck.image; }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="truck-detail-body">
        {/* Title Section */}
        <div className="detail-title-section">
          <div className="title-row">
            <h1>
              {truck.name}
              {truck.verified && (
                <span className="verified-badge" title="Verified by Cravvr" aria-label="Verified">
                  {Icons.checkCircle || Icons.check}
                </span>
              )}
            </h1>
            <div className="rating-pill">
              <span className="star">{Icons.star}</span>
              <span className="rating-num">{truck.rating || 4.5}</span>
              <span className="review-text">({truck.reviewCount || 0})</span>
            </div>
          </div>
          <p className="detail-cuisine">{truck.cuisine || 'Food Truck'} • {truck.priceRange || '$$'}</p>
          <p className="detail-description">{truck.description || 'Delicious food made fresh daily. Visit us to discover our amazing menu!'}</p>
        </div>

        {/* Not Accepting Orders Banner */}
        {truck.isOpen && !truck.acceptingOrders && (
          <div className="not-accepting-banner">
            {Icons.clock}
            <span>This truck is not accepting orders right now. Check back shortly!</span>
          </div>
        )}

        {/* Content sections */}
        <div className="truck-detail-content-flow">
            {/* Inline Info Strip */}
            <div className="truck-info-strip">
              <span className="info-strip-rating">
                {Icons.star} {truck.rating || 4.5} ({truck.reviewCount || 0} ratings)
              </span>
              <span className="info-strip-dot">·</span>
              <span>{truck.distance || '1.0 mi'}</span>
              <span className="info-strip-dot">·</span>
              <span>{truck.priceRange || '$$'}</span>
              <span className="info-strip-dot">·</span>
              <span className={`info-strip-status ${truck.isOpen !== false ? 'open' : 'closed'}`}>
                {truck.isOpen !== false ? 'Open Now' : 'Closed'}
              </span>
              {truck.prepTime && (
                <>
                  <span className="info-strip-dot">·</span>
                  <span>{truck.prepTime}</span>
                </>
              )}
            </div>
            <div className="truck-meta-row">
              <span className="meta-location" onClick={handleGetDirections}>
                {Icons.mapPin} {truck.location || 'Portland, OR'}
              </span>
              <span className="meta-hours">
                {Icons.clock} {truck.hours || '11am - 9pm'}
              </span>
            </div>

            {/* Deals & Benefits Section */}
            {deals.length > 0 && (
              <div className="detail-section deals-section">
                <h3>Deals & Benefits</h3>
                <div className="deals-scroll">
                  {deals.map(deal => (
                    <div key={deal.id} className="deal-card">
                      <span className="deal-emoji">{deal.emoji}</span>
                      <div className="deal-content">
                        <h4>{deal.title}</h4>
                        <p>{deal.description}</p>
                        {deal.code && <span className="deal-code">{deal.code}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Items Carousel */}
            {featuredItems.length > 0 && (
              <div className="detail-section featured-items-section">
                <div className="section-header-detail">
                  <h3>Featured Items</h3>
                  <div className="scroll-btns-detail">
                    <button onClick={() => scrollFeatured('left')}>{Icons.chevronLeft}</button>
                    <button onClick={() => scrollFeatured('right')}>{Icons.chevronRight}</button>
                  </div>
                </div>
                <div className="featured-items-scroll" ref={featuredScrollRef}>
                  {featuredItems.map(item => (
                    <div key={item.id} className="featured-item-card" onClick={() => handleAddToCart(item)}>
                      <div className="featured-item-image">
                        <img src={item.image} alt={item.name} />
                        <span className="featured-add-btn">+</span>
                      </div>
                      <div className="featured-item-info">
                        <h4>{item.name}</h4>
                        <span className="featured-item-price">{item.priceFormatted}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            <div className="detail-section">
              <h3>Features & Dietary</h3>
              <div className="features-grid">
                {features.map((feature, idx) => (
                  <span key={idx} className="feature-tag">
                    <span className="feature-check">{Icons.check}</span>
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Menu Section */}
            <div className="detail-section menu-section-img">
          <div className="section-header">
            <h3>Menu</h3>
            <span className="menu-count">{filteredMenuItems.length} items</span>
          </div>

          {/* Menu Search */}
          <div className="menu-search">
            <span className="search-icon">{Icons.search}</span>
            <input
              type="text"
              placeholder={`Search ${truck.name}'s menu...`}
              value={menuSearchQuery}
              onChange={(e) => setMenuSearchQuery(e.target.value)}
            />
            {menuSearchQuery && (
              <button className="search-clear" onClick={() => setMenuSearchQuery('')}>
                {Icons.x}
              </button>
            )}
          </div>

          {/* Category Pills */}
          {categories.length > 1 && (
            <div className="menu-categories">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`menu-category-pill ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          )}

          {/* Menu Items Grid */}
          <div className="menu-grid-img">
            {filteredMenuItems.length === 0 ? (
              menuItems.length === 0 ? (
                <div className="no-menu-results">
                  <span>📋</span>
                  <p>Menu not available yet</p>
                  <p style={{ fontSize: '14px', color: '#9ca3af' }}>This truck hasn't added their menu items yet. Check back soon!</p>
                </div>
              ) : (
                <div className="no-menu-results">
                  <span>🔍</span>
                  <p>No items match your search</p>
                  <button onClick={() => { setMenuSearchQuery(''); setActiveCategory('all'); }}>Clear filters</button>
                </div>
              )
            ) : (
              filteredMenuItems.map(item => (
                <div key={item.id} className="menu-item-card-img">
                  <div className="menu-item-details">
                    <h4 className="menu-item-name">{item.name}</h4>
                    <p className="menu-item-desc">{item.description}</p>
                    <div className="menu-item-footer">
                      <span className="menu-item-price">{item.priceFormatted}</span>
                      {item.averageRating > 0 && (
                        <span className="menu-item-rating-inline">
                          {Icons.star} {item.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="menu-item-actions">
                      <button
                        className={`add-to-cart-btn ${addedItem === item.id ? 'added' : ''}`}
                        onClick={() => handleAddToCart(item)}
                      >
                        {addedItem === item.id ? (
                          <>
                            Added!
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
                      </button>
                      {orderedItemIds.includes(item.id) && (
                        <button
                          className="rate-item-btn"
                          onClick={() => handleOpenItemRating(item)}
                          title="Rate this item"
                        >
                          {Icons.star}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="menu-item-image">
                    <img src={item.image} alt={item.name} />
                    {item.popular && <span className="popular-badge">Popular</span>}
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
        </div>{/* End content flow */}

        {/* Reviews Section - Full width below columns */}
        <div className="detail-section reviews-section">
          <div className="section-header-detail">
            <h3>Reviews ({truck.reviewCount || reviews.length})</h3>
            {canReview && (
              <button className="write-review-btn" onClick={handleOpenReviewModal}>
                {Icons.star}
                {existingReview ? 'Edit Review' : 'Write a Review'}
              </button>
            )}
          </div>

          {!canReview && user && (
            <div className="review-eligibility-notice">
              <span>🛒</span>
              <p>Complete an order to leave a review</p>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="no-reviews">
              <span className="no-reviews-emoji">📝</span>
              <p>No reviews yet. {canReview ? 'Be the first to review!' : 'Order to be the first reviewer!'}</p>
              {canReview && (
                <button className="write-review-btn-empty" onClick={handleOpenReviewModal}>
                  Write a Review
                </button>
              )}
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">
                        {review.customerName?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <span className="reviewer-name">{review.customerName || 'Customer'}</span>
                        <div className="review-rating">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`star-icon ${i < review.rating ? 'filled' : ''}`}>
                              {i < review.rating ? Icons.star : Icons.starOutline}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="review-date">{formatRelativeTime(review.createdAt)}</span>
                  </div>
                  {review.comment && <p className="review-comment">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="detail-cta">
          <button className="cta-directions" onClick={handleGetDirections}>
            {Icons.mapPin}
            Get Directions
          </button>
          <button className="cta-share" onClick={handleShare}>
            {Icons.share}
            Share
          </button>
        </div>
      </div>
        </div>

        {/* Right Cart Sidebar — desktop only */}
        <div className="truck-detail-cart-sidebar">
          <SidebarCart />
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        truck={truck}
        userId={user?.id}
        existingReview={existingReview}
        onSuccess={handleReviewSuccess}
      />

      {/* Menu Item Rating Modal */}
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
