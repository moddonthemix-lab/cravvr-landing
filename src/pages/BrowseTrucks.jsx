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
  const { user } = useAuth();
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [favorites, setFavorites] = useState([]);

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

  // Main Browse View
  return (
    <div className="app-view explore-view-new">
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
      <div className="bottom-nav">
        <button className="nav-item active">
          {Icons.mapPin}
          <span>Map</span>
        </button>
        <button className="nav-item">
          {Icons.compass}
          <span>Discover</span>
        </button>
        <button className="nav-item">
          {Icons.bolt}
          <span>Bolt</span>
        </button>
        <button className="nav-item">
          {Icons.calendar}
          <span>Events</span>
        </button>
        <button className="nav-item">
          {Icons.message}
          <span>Login</span>
        </button>
      </div>
    </div>
  );
};

export default BrowseTrucks;
