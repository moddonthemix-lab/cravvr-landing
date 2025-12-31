import React, { useState, useEffect } from 'react';

// Icons
const Icons = {
  menu: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  ),
  search: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.35-4.35"></path>
    </svg>
  ),
  star: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.167L12 18.896l-7.334 3.867 1.4-8.167-5.934-5.787 8.2-1.192z" />
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
  location: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  ),
  arrowRight: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  ),
  arrowLeft: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  ),
  home: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  ),
  map: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
      <line x1="8" y1="2" x2="8" y2="18"></line>
      <line x1="16" y1="6" x2="16" y2="22"></line>
    </svg>
  ),
  cart: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
  ),
  user: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  bolt: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
    </svg>
  )
};

// Category emojis
const categoryEmojis = {
  'Pizza': '🍕',
  'Burgers': '🍔',
  'Tacos': '🌮',
  'BBQ': '🍖',
  'Breakfast': '🥞',
  'Mexican': '🌮',
  'American': '🍔',
  'Thai': '🍜',
  'Italian': '🍕',
  'Coffee': '☕',
  'Seafood': '🦐'
};

const BrowseTrucks = () => {
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
        .order('created_at', { ascending: false});

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

  // Get unique cuisines from actual trucks
  const cuisineFilters = ['all', ...new Set(trucks.map(t => t.cuisine).filter(Boolean))];

  // Filter trucks
  const filteredTrucks = trucks.filter(truck => {
    const matchesSearch = truck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (truck.cuisine || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || truck.cuisine === activeFilter;
    return matchesSearch && matchesFilter;
  });

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

        {/* Menu */}
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

        {/* Bottom Navigation */}
        <div className="bottom-nav-browse">
          <button className="bottom-nav-item">
            <span className="bottom-nav-icon">{Icons.home}</span>
            <span>Home</span>
          </button>
          <button className="bottom-nav-item">
            <span className="bottom-nav-icon">{Icons.map}</span>
            <span>Map</span>
          </button>
          <button className="bottom-nav-item active">
            <span className="bottom-nav-icon">{Icons.bolt}</span>
            <span>Bolt</span>
          </button>
          <button className="bottom-nav-item">
            <span className="bottom-nav-icon">{Icons.heart}</span>
            <span>Saved</span>
          </button>
          <button className="bottom-nav-item">
            <span className="bottom-nav-icon">{Icons.user}</span>
            <span>Profile</span>
          </button>
        </div>
      </div>
    );
  }

  // Main Browse View - Matching Screenshot Design
  return (
    <div className="browse-app-container">
      {/* Header - Pink Gradient */}
      <div className="browse-header">
        <button className="browse-menu-btn">{Icons.menu}</button>
        <h1 className="browse-title">Browse</h1>
        <button className="browse-filter-btn">Filter</button>
      </div>

      {/* Search Bar */}
      <div className="browse-search-container">
        <div className="browse-search-box">
          <span className="search-icon">{Icons.search}</span>
          <input
            type="text"
            placeholder="Search for trucks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Filter Chips with Emojis */}
      <div className="browse-category-filters">
        {cuisineFilters.map(filter => {
          const emoji = categoryEmojis[filter] || '🍴';
          return (
            <button
              key={filter}
              className={`category-chip ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              <span className="category-emoji">{emoji}</span>
              <span>{filter === 'all' ? 'All' : filter}</span>
            </button>
          );
        })}
      </div>

      {/* Nearby Trucks Section */}
      <div className="browse-section">
        <div className="browse-section-header">
          <h2>Nearby trucks</h2>
          <button className="map-link">
            Map {Icons.arrowRight}
          </button>
        </div>

        {/* Truck Cards */}
        <div className="browse-truck-list">
          {filteredTrucks.length === 0 ? (
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
          ) : (
            filteredTrucks.map((truck) => (
              <div
                key={truck.id}
                className="browse-truck-card"
                onClick={() => handleTruckClick(truck)}
              >
                {/* Truck Image */}
                <div className="browse-truck-image">
                  <img
                    src={truck.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800'}
                    alt={truck.name}
                  />
                  {/* LIVE Badge */}
                  {truck.status === 'open' && (
                    <div className="live-badge">LIVE</div>
                  )}
                  {/* Rating Badge */}
                  <div className="rating-badge-browse">
                    {Icons.star} {truck.rating || '4.8'}
                  </div>
                </div>

                {/* Truck Info */}
                <div className="browse-truck-info">
                  <h3 className="browse-truck-name">{truck.name}</h3>
                  <p className="browse-truck-cuisine">
                    {truck.cuisine} • Street Food
                  </p>
                  <div className="browse-truck-meta">
                    <span className="browse-truck-distance">
                      {Icons.location} 0.3 mi away
                    </span>
                    <span className="browse-truck-status">
                      {truck.status === 'open' ? 'Open now' : 'Closed'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav-browse">
        <button className="bottom-nav-item">
          <span className="bottom-nav-icon">{Icons.home}</span>
          <span>Home</span>
        </button>
        <button className="bottom-nav-item">
          <span className="bottom-nav-icon">{Icons.map}</span>
          <span>Map</span>
        </button>
        <button className="bottom-nav-item active">
          <span className="bottom-nav-icon">{Icons.bolt}</span>
          <span>Bolt</span>
        </button>
        <button className="bottom-nav-item">
          <span className="bottom-nav-icon">{Icons.heart}</span>
          <span>Saved</span>
        </button>
        <button className="bottom-nav-item">
          <span className="bottom-nav-icon">{Icons.user}</span>
          <span>Profile</span>
        </button>
      </div>
    </div>
  );
};

export default BrowseTrucks;
