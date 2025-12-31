import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Icons
const Icons = {
  search: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.35-4.35"></path>
    </svg>
  ),
  filter: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
  ),
  star: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.167L12 18.896l-7.334 3.867 1.4-8.167-5.934-5.787 8.2-1.192z" />
    </svg>
  ),
  compass: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
    </svg>
  ),
  heart: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  ),
  heartFilled: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  ),
  arrowLeft: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  ),
  truck: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 4h13v2H3V4m18 4v8a2 2 0 0 1-2 2h-1.17a3 3 0 0 1-5.66 0H9.83a3 3 0 0 1-5.66 0H3c-1.11 0-2-.89-2-2l.03-6A2 2 0 0 1 3 8h9v6H4.5v2H6.8c.5-.77 1.28-1.3 2.2-1.3.92 0 1.7.53 2.2 1.3h5.6c.5-.77 1.28-1.3 2.2-1.3s1.7.53 2.2 1.3H19v-6h2m-2-2l2 3h-2v-3M7 16.5A1.5 1.5 0 0 0 5.5 18A1.5 1.5 0 0 0 7 19.5A1.5 1.5 0 0 0 8.5 18A1.5 1.5 0 0 0 7 16.5m11 0a1.5 1.5 0 0 0-1.5 1.5a1.5 1.5 0 0 0 1.5 1.5a1.5 1.5 0 0 0 1.5-1.5a1.5 1.5 0 0 0-1.5-1.5z"/>
    </svg>
  ),
  mapPin: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  ),
  bolt: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
    </svg>
  ),
  calendar: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  message: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  )
};

const BrowseTrucks = () => {
  const { user, signIn, signOut } = useAuth();
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('map');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [discoverIndex, setDiscoverIndex] = useState(0);
  const [boltRadius, setBoltRadius] = useState(5);
  const [boltSuggestions, setBoltSuggestions] = useState(null);

  const supabase = window.supabaseClient;

  useEffect(() => {
    loadTrucks();
  }, []);

  const loadTrucks = async () => {
    try {
      const { data, error } = await supabase
        .from('food_trucks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrucks(data || []);
    } catch (error) {
      console.error('Error loading trucks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTruckMenu = async (truckId) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('truck_id', truckId)
        .order('category', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading menu:', error);
      return [];
    }
  };

  const handleTruckClick = async (truck) => {
    const menu = await loadTruckMenu(truck.id);
    setSelectedTruck({ ...truck, menu });
  };

  const toggleFavorite = (truckId) => {
    setFavorites(prev =>
      prev.includes(truckId)
        ? prev.filter(id => id !== truckId)
        : [...prev, truckId]
    );
  };

  const handleTabClick = (tab) => {
    if (tab === 'login') {
      if (user) {
        // If logged in, show logout option or profile
        const shouldLogout = window.confirm('You are logged in. Do you want to logout?');
        if (shouldLogout) {
          signOut();
        }
      } else {
        setShowLoginModal(true);
      }
    } else {
      setActiveTab(tab);
      setSelectedTruck(null);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      setShowLoginModal(false);
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  const handleSwipe = (direction) => {
    if (direction === 'right') {
      const currentTruck = trucks[discoverIndex];
      setFavorites(prev => [...prev, currentTruck.id]);
    }
    setDiscoverIndex(prev => prev + 1);
  };

  const generateBoltSuggestions = async () => {
    if (trucks.length === 0) return;

    // Get random truck
    const randomTruck = trucks[Math.floor(Math.random() * trucks.length)];

    // Load its menu
    const menu = await loadTruckMenu(randomTruck.id);

    // Get 2 random menu items
    if (menu.length > 0) {
      const shuffled = [...menu].sort(() => 0.5 - Math.random());
      const selectedMeals = shuffled.slice(0, Math.min(2, menu.length));

      setBoltSuggestions({
        truck: randomTruck,
        meals: selectedMeals
      });
    }
  };

  const cuisineFilters = ['all', ...new Set(trucks.map(t => t.cuisine).filter(Boolean))];

  const filteredTrucks = trucks.filter(truck => {
    const matchesSearch = truck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (truck.cuisine || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || truck.cuisine === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const featuredTrucks = filteredTrucks.filter(t => t.image_url).slice(0, 4);
  const nearbyTrucks = filteredTrucks.slice(0, 2);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading trucks...</p>
      </div>
    );
  }

  // Truck Detail View
  if (selectedTruck) {
    const groupedMenu = selectedTruck.menu.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    return (
      <div className="app-view" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
        <button
          onClick={() => setSelectedTruck(null)}
          style={{
            marginBottom: '20px',
            padding: '10px 20px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {Icons.arrowLeft} Back to Browse
        </button>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          {selectedTruck.image_url && (
            <img
              src={selectedTruck.image_url}
              alt={selectedTruck.name}
              style={{ width: '100%', height: '300px', objectFit: 'cover' }}
            />
          )}
          <div style={{ padding: '30px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>{selectedTruck.name}</h1>
            <p style={{ color: '#666', fontSize: '18px', marginBottom: '15px' }}>{selectedTruck.cuisine}</p>
            <p style={{ color: '#666', marginBottom: '15px' }}>{selectedTruck.description}</p>
            <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#666' }}>
              {selectedTruck.phone && <span>📞 {selectedTruck.phone}</span>}
              {selectedTruck.location && <span>📍 {selectedTruck.location}</span>}
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Menu</h2>
        {Object.keys(groupedMenu).length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '60px 30px',
            textAlign: 'center',
            color: '#9ca3af'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🍽️</div>
            <p>No menu items available yet</p>
          </div>
        ) : (
          Object.entries(groupedMenu).map(([category, items]) => (
            <div key={category} style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', color: '#374151' }}>
                {category}
              </h3>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px', color: '#111827' }}>
                          {item.name}
                        </h4>
                        {item.description && (
                          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                            {item.description}
                          </p>
                        )}
                      </div>
                      <p style={{ fontSize: '18px', fontWeight: '600', color: '#8b5cf6', marginLeft: '20px' }}>
                        ${item.price?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // Login Modal
  const LoginModal = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const { signUp } = useAuth();

    const handleSubmit = async () => {
      if (isSignUp) {
        // Sign up logic
        try {
          const { error } = await signUp(email, password, {
            role: 'customer',
            name: email.split('@')[0]
          });
          if (error) throw error;
          alert('Sign up successful! Please check your email to verify your account.');
          setShowLoginModal(false);
        } catch (error) {
          alert('Sign up failed: ' + error.message);
        }
      } else {
        handleLogin(email, password);
      }
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '400px',
          width: '90%'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
            {isSignUp ? 'Sign Up for Cravvr' : 'Login to Cravvr'}
          </h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '12px',
              fontSize: '16px'
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '20px',
              fontSize: '16px'
            }}
          />
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button
              onClick={handleSubmit}
              style={{
                flex: 1,
                padding: '12px',
                background: 'linear-gradient(135deg, #e11d48 0%, #be185d 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {isSignUp ? 'Sign Up' : 'Login'}
            </button>
            <button
              onClick={() => setShowLoginModal(false)}
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
          <div style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                background: 'none',
                border: 'none',
                color: '#e11d48',
                fontWeight: '600',
                cursor: 'pointer',
                marginLeft: '4px',
                textDecoration: 'underline'
              }}
            >
              {isSignUp ? 'Login' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Discover Tab View
  if (activeTab === 'discover') {
    // Handle empty state
    if (trucks.length === 0) {
      return (
        <div className="app-view explore-view-new">
          <div className="explore-hero">
            <div className="explore-hero-content">
              <h1 className="explore-hero-title">
                <span className="gradient-text">Discover</span> New Favorites
              </h1>
              <p className="explore-hero-subtitle">Swipe to find your next favorite truck</p>
            </div>
          </div>
          <div style={{ padding: '80px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>🚚</div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px', color: '#374151' }}>
              No Food Trucks Yet
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '16px', maxWidth: '400px', margin: '0 auto 30px' }}>
              Add demo data to start discovering food trucks.
            </p>
            <a
              href="/add-demo-data.html"
              style={{
                display: 'inline-block',
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #e11d48 0%, #be185d 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(225,29,72,0.3)'
              }}
            >
              Add Demo Data
            </a>
          </div>
          {renderBottomNav()}
        </div>
      );
    }

    const currentTruck = trucks[discoverIndex];

    if (discoverIndex >= trucks.length) {
      return (
        <div className="app-view explore-view-new">
          <div className="explore-hero">
            <div className="explore-hero-content">
              <h1 className="explore-hero-title">
                <span className="gradient-text">Discover</span> New Favorites
              </h1>
              <p className="explore-hero-subtitle">Swipe to find your next favorite truck</p>
            </div>
          </div>
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px', color: '#374151' }}>
              You've seen all trucks!
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              Check back later for new food trucks in your area.
            </p>
            <button
              onClick={() => setDiscoverIndex(0)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #e11d48 0%, #be185d 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Start Over
            </button>
          </div>
          {renderBottomNav()}
        </div>
      );
    }

    if (!currentTruck) {
      return (
        <div className="app-view explore-view-new">
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>Loading trucks...</p>
          </div>
          {renderBottomNav()}
        </div>
      );
    }

    return (
      <div className="app-view discover-swipe-view">
        <div style={{ padding: '20px 20px 120px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
          {/* Swipe Card */}
          <div className="swipe-card" style={{
            width: '100%',
            maxWidth: '500px',
            marginTop: '40px'
          }}>
            {/* Card Image */}
            <div style={{
              width: '100%',
              height: '400px',
              borderRadius: '20px',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #e11d48 0%, #be185d 50%, #9333ea 100%)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {currentTruck.image_url ? (
                <img
                  src={currentTruck.image_url}
                  alt={currentTruck.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ fontSize: '120px' }}>🌮</div>
              )}
            </div>

            {/* Card Info */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              marginTop: '-20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              position: 'relative',
              zIndex: 1
            }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>{currentTruck.name}</h2>
              <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '12px' }}>{currentTruck.cuisine}</p>
              {currentTruck.description && (
                <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>
                  {currentTruck.description}
                </p>
              )}

              <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', fontSize: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {Icons.mapPin}
                  <span>{currentTruck.location || '0.3 mi away'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
                  {Icons.star}
                  <span>{currentTruck.rating || '4.8'}</span>
                </div>
              </div>

              {/* Dietary Options */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '6px 12px',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  🌱 Vegan
                </span>
                <span style={{
                  padding: '6px 12px',
                  background: '#fef2f2',
                  color: '#dc2626',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  🚫 Gluten-Free
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '20px',
            marginTop: '30px',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => handleSwipe('left')}
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                border: '3px solid #e5e7eb',
                background: 'white',
                color: '#6b7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              ✕
            </button>
            <button
              onClick={() => handleTruckClick(currentTruck)}
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                border: '3px solid #3b82f6',
                background: '#3b82f6',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
              }}
            >
              {Icons.mapPin}
            </button>
            <button
              onClick={() => handleSwipe('right')}
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                border: '3px solid #ec4899',
                background: '#ec4899',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(236,72,153,0.3)'
              }}
            >
              ♥
            </button>
          </div>
        </div>
        {renderBottomNav()}
      </div>
    );
  }

  // Bolt Tab View
  if (activeTab === 'bolt') {
    // Handle empty state
    if (trucks.length === 0) {
      return (
        <div className="app-view explore-view-new">
          <div className="explore-hero">
            <div className="explore-hero-content" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚡</div>
              <h1 className="explore-hero-title" style={{ fontSize: '32px', marginBottom: '12px' }}>
                Bolt
              </h1>
              <p className="explore-hero-subtitle">Let me help you discover something new!</p>
            </div>
          </div>
          <div style={{ padding: '80px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>🚚</div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px', color: '#374151' }}>
              No Food Trucks Yet
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '16px', maxWidth: '400px', margin: '0 auto 30px' }}>
              Add demo data to start generating meal suggestions.
            </p>
            <a
              href="/add-demo-data.html"
              style={{
                display: 'inline-block',
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #e11d48 0%, #be185d 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(225,29,72,0.3)'
              }}
            >
              Add Demo Data
            </a>
          </div>
          {renderBottomNav()}
        </div>
      );
    }

    return (
      <div className="app-view explore-view-new">
        {/* Bolt Header */}
        <div className="explore-hero">
          <div className="explore-hero-content" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚡</div>
            <h1 className="explore-hero-title" style={{ fontSize: '32px', marginBottom: '12px' }}>
              Bolt
            </h1>
            <p className="explore-hero-subtitle">Let me help you discover something new!</p>
          </div>
        </div>

        <div style={{ padding: '30px 20px 120px', maxWidth: '600px', margin: '0 auto' }}>
          {/* Search Radius Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ color: '#9333ea', fontSize: '20px' }}>{Icons.mapPin}</span>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Search Radius</h3>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Distance:</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#9333ea' }}>{boltRadius} miles</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                value={boltRadius}
                onChange={(e) => setBoltRadius(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '5px',
                  background: 'linear-gradient(90deg, #9333ea 0%, #e11d48 100%)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
                <span>1 mi</span>
                <span>6 mi</span>
              </div>
            </div>
          </div>

          {/* Ready to Explore Section */}
          {!boltSuggestions ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '80px', marginBottom: '20px' }}>⚡</div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>Ready to explore?</h2>
              <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '15px' }}>
                I'll find you a great food truck and event!
              </p>
              <button
                onClick={generateBoltSuggestions}
                style={{
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #9333ea 0%, #e11d48 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(147,51,234,0.3)'
                }}
              >
                ✨ Generate Suggestions
              </button>

              {/* How it Works */}
              <div style={{
                background: '#fef3c7',
                borderRadius: '12px',
                padding: '20px',
                marginTop: '40px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>💡</span>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>How it works:</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#78350f', lineHeight: '1.8' }}>
                      <li>Only open trucks within your radius are shown</li>
                      <li>Events and meals are randomly selected just for you!</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Bolt Suggestions Result */
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>
                Your Bolt Suggestions ⚡
              </h2>

              {/* Truck Card */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                marginBottom: '20px'
              }}>
                {boltSuggestions.truck.image_url && (
                  <img
                    src={boltSuggestions.truck.image_url}
                    alt={boltSuggestions.truck.name}
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                  />
                )}
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {boltSuggestions.truck.name}
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '12px' }}>{boltSuggestions.truck.cuisine}</p>

                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>
                    Recommended Meals:
                  </h4>
                  {boltSuggestions.meals.map((meal, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        marginBottom: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>{meal.name}</div>
                          {meal.description && (
                            <div style={{ fontSize: '13px', color: '#6b7280' }}>{meal.description}</div>
                          )}
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#9333ea' }}>
                          ${meal.price?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => handleTruckClick(boltSuggestions.truck)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #9333ea 0%, #e11d48 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginTop: '16px'
                    }}
                  >
                    View Full Menu
                  </button>
                </div>
              </div>

              <button
                onClick={() => setBoltSuggestions(null)}
                style={{
                  width: '100%',
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
                Try Again
              </button>
            </div>
          )}
        </div>
        {renderBottomNav()}
      </div>
    );
  }

  // Events Tab View
  if (activeTab === 'events') {
    const mockEvents = [
      {
        id: 1,
        title: 'Downtown Food Truck Festival',
        date: 'Saturday, Jan 6',
        time: '11:00 AM - 8:00 PM',
        location: 'Central Park, Downtown',
        trucks: 12,
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800'
      },
      {
        id: 2,
        title: 'Taco Tuesday Meetup',
        date: 'Tuesday, Jan 9',
        time: '5:00 PM - 9:00 PM',
        location: 'Riverside Plaza',
        trucks: 5,
        image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800'
      },
      {
        id: 3,
        title: 'Weekend Market & Trucks',
        date: 'Sunday, Jan 14',
        time: '10:00 AM - 4:00 PM',
        location: 'Farmers Market Square',
        trucks: 8,
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800'
      }
    ];

    return (
      <div className="app-view explore-view-new">
        <div className="explore-hero">
          <div className="explore-hero-content">
            <h1 className="explore-hero-title">
              Food Truck <span className="gradient-text">Events</span>
            </h1>
            <p className="explore-hero-subtitle">Find trucks at festivals, markets, and special events</p>
          </div>
        </div>

        <div style={{ padding: '20px 20px 120px', maxWidth: '900px', margin: '0 auto' }}>
          {mockEvents.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📅</div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px', color: '#374151' }}>
                No Events Scheduled
              </h2>
              <p style={{ color: '#6b7280' }}>
                Check back later for upcoming food truck events near you.
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
                Upcoming Events ({mockEvents.length})
              </h2>
              {mockEvents.map((event, index) => (
                <div
                  key={event.id}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    marginBottom: '20px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    animation: `fadeInUp 0.6s ease forwards ${index * 100}ms`,
                    opacity: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: window.innerWidth < 600 ? 'column' : 'row' }}>
                    <img
                      src={event.image}
                      alt={event.title}
                      style={{
                        width: window.innerWidth < 600 ? '100%' : '200px',
                        height: '180px',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ padding: '20px', flex: 1 }}>
                      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
                        {event.title}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#6b7280', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📅</span>
                          <span>{event.date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🕐</span>
                          <span>{event.time}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📍</span>
                          <span>{event.location}</span>
                        </div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '8px',
                          padding: '6px 12px',
                          background: '#f0fdf4',
                          color: '#16a34a',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '600',
                          width: 'fit-content'
                        }}>
                          🚚 {event.trucks} Trucks
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        {renderBottomNav()}
      </div>
    );
  }

  // Bottom Navigation Component
  const renderBottomNav = () => (
    <div className="bottom-nav">
      <button
        className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
        onClick={() => handleTabClick('map')}
      >
        {Icons.mapPin}
        <span>Map</span>
      </button>
      <button
        className={`nav-item ${activeTab === 'discover' ? 'active' : ''}`}
        onClick={() => handleTabClick('discover')}
      >
        {Icons.compass}
        <span>Discover</span>
      </button>
      <button
        className={`nav-item ${activeTab === 'bolt' ? 'active' : ''}`}
        onClick={() => handleTabClick('bolt')}
      >
        {Icons.bolt}
        <span>Bolt</span>
      </button>
      <button
        className={`nav-item ${activeTab === 'events' ? 'active' : ''}`}
        onClick={() => handleTabClick('events')}
      >
        {Icons.calendar}
        <span>Events</span>
      </button>
      <button
        className={`nav-item ${user ? 'active' : ''}`}
        onClick={() => handleTabClick('login')}
      >
        {Icons.message}
        <span>{user ? 'Profile' : 'Login / Sign Up'}</span>
      </button>
    </div>
  );

  // Main Browse View (Map Tab)
  return (
    <div className="app-view explore-view-new">
      {showLoginModal && <LoginModal />}
      {/* Hero Search Section */}
      <div className="explore-hero">
        <div className="explore-hero-content">
          <h1 className="explore-hero-title">
            What are you <span className="gradient-text">craving</span>?
          </h1>
          <p className="explore-hero-subtitle">Discover {trucks.length} amazing food trucks near you</p>
        </div>
        <div className="explore-search-wrapper">
          <div className="explore-search-box">
            <span className="search-icon">{Icons.search}</span>
            <input
              type="text"
              placeholder="Search trucks, cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-filter-btn">
              {Icons.filter}
            </button>
          </div>
        </div>
      </div>

      {/* Cuisine Filters */}
      {trucks.length > 0 && (
        <div className="explore-filters">
          <div className="filter-scroll">
            {cuisineFilters.map(filter => (
              <button
                key={filter}
                className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter === 'all' ? 'All Trucks' : filter}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State - No Trucks */}
      {trucks.length === 0 && (
        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🚚</div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px', color: '#374151' }}>
            No Food Trucks Yet
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '16px', maxWidth: '400px', margin: '0 auto 30px' }}>
            Add demo data to get started and explore food trucks in your area.
          </p>
          <a
            href="/add-demo-data.html"
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #e11d48 0%, #be185d 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(225,29,72,0.3)'
            }}
          >
            Add Demo Data
          </a>
        </div>
      )}

      {/* Featured Section */}
      {featuredTrucks.length > 0 && (
        <div className="explore-section">
          <div className="section-header-row">
            <div className="section-label">
              <span className="section-icon featured-icon">{Icons.star}</span>
              <h2>Featured</h2>
            </div>
            <span className="section-count">{featuredTrucks.length} trucks</span>
          </div>
          <div className="featured-trucks-scroll">
            {featuredTrucks.map((truck, index) => (
              <div
                key={truck.id}
                className="featured-truck-card-img"
                onClick={() => handleTruckClick(truck)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="featured-card-image">
                  <img src={truck.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800'} alt={truck.name} />
                  <div className="featured-card-overlay">
                    <button
                      className={`card-fav-btn ${favorites.includes(truck.id) ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(truck.id); }}
                    >
                      {favorites.includes(truck.id) ? Icons.heartFilled : Icons.heart}
                    </button>
                    <span className="featured-badge-pill">
                      {Icons.star} Featured
                    </span>
                  </div>
                  <div className="delivery-time-badge">
                    15-25 min
                  </div>
                </div>
                <div className="featured-card-body">
                  <div className="featured-card-title-row">
                    <h3>{truck.name}</h3>
                    <span className="rating-badge">
                      {Icons.star} {truck.rating || '4.8'}
                    </span>
                  </div>
                  <p className="featured-card-meta-text">
                    {truck.cuisine} • $$ • 0.5 mi
                  </p>
                  <div className="featured-card-bottom">
                    <span className="delivery-fee">
                      $1.99 Delivery
                    </span>
                    <div className={`status-pill ${truck.status === 'open' ? 'open' : 'closed'}`}>
                      <span className="status-dot"></span>
                      {truck.status === 'open' ? 'Open' : 'Closed'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nearby Section */}
      <div className="explore-section">
        <div className="section-header-row">
          <div className="section-label">
            <span className="section-icon">{Icons.compass}</span>
            <h2>Nearby</h2>
          </div>
          <span className="section-count">{nearbyTrucks.length} trucks</span>
        </div>
        <div className="nearby-trucks-grid">
          {nearbyTrucks.map((truck, index) => (
            <div
              key={truck.id}
              className="nearby-truck-card"
              onClick={() => handleTruckClick(truck)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="nearby-card-image">
                <img src={truck.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800'} alt={truck.name} />
                <button
                  className={`card-fav-btn-nearby ${favorites.includes(truck.id) ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(truck.id); }}
                >
                  {favorites.includes(truck.id) ? Icons.heartFilled : Icons.heart}
                </button>
                <div className="delivery-time-badge-nearby">
                  20-30 min
                </div>
              </div>
              <div className="nearby-card-body">
                <div className="nearby-card-header">
                  <h3>{truck.name}</h3>
                  <span className="rating-badge-nearby">
                    {Icons.star} {truck.rating || '4.6'}
                  </span>
                </div>
                <p className="nearby-card-cuisine">
                  {truck.cuisine} • $$$
                </p>
                <div className="nearby-card-footer">
                  <span>${truck.rating || '2.49'} • 1.2 mi</span>
                  <span className="status-dot-inline open"></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredTrucks.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#666'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔍</div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>
            No trucks found
          </h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}

      {/* Bottom Navigation */}
      {renderBottomNav()}
    </div>
  );
};

export default BrowseTrucks;
