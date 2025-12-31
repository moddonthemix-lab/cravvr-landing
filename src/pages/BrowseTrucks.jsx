import React, { useState, useEffect } from 'react';

// Icons (matching the ones from App.jsx)
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
  )
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

  // Get unique cuisines from actual trucks
  const cuisineFilters = ['all', ...new Set(trucks.map(t => t.cuisine).filter(Boolean))];

  // Filter trucks
  const filteredTrucks = trucks.filter(truck => {
    const matchesSearch = truck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (truck.cuisine || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || truck.cuisine === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // For now, we can mark trucks with images as featured (or you can add a featured field later)
  const featuredTrucks = filteredTrucks.filter(t => t.image_url);
  const regularTrucks = filteredTrucks;

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
      </div>
    );
  }

  // Main Browse View - EXACT COPY of ExploreView
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
                </div>
                <div className="featured-card-body">
                  <div className="featured-card-title-row">
                    <h3>{truck.name}</h3>
                    <span className="rating-badge">
                      {Icons.star} {truck.rating || '4.5'}
                    </span>
                  </div>
                  <p className="featured-card-meta-text">
                    {truck.cuisine} • {truck.location}
                  </p>
                  <div className="featured-card-bottom">
                    <span className="delivery-fee">
                      Free Delivery
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

      {/* All Trucks Grid */}
      <div className="explore-section">
        <div className="section-header-row">
          <div className="section-label">
            <span className="section-icon">{Icons.compass}</span>
            <h2>Nearby</h2>
          </div>
          <span className="section-count">{regularTrucks.length} trucks</span>
        </div>
        <div className="trucks-grid-img">
          {regularTrucks.map((truck, index) => (
            <div
              key={truck.id}
              className="truck-card-img"
              onClick={() => handleTruckClick(truck)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="truck-card-image-wrapper">
                <img
                  src={truck.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800'}
                  alt={truck.name}
                  className="truck-card-image"
                />
                <button
                  className={`card-fav-btn ${favorites.includes(truck.id) ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(truck.id); }}
                >
                  {favorites.includes(truck.id) ? Icons.heartFilled : Icons.heart}
                </button>
              </div>
              <div className="truck-card-info">
                <div className="truck-card-header">
                  <h3>{truck.name}</h3>
                  <span className="rating-pill">
                    {Icons.star} {truck.rating || '4.5'}
                  </span>
                </div>
                <p className="truck-card-cuisine">{truck.cuisine} • {truck.location}</p>
                <div className="truck-card-meta">
                  <span className="delivery-info">
                    Free Delivery
                  </span>
                  <div className={`status-dot-small ${truck.status === 'open' ? 'open' : 'closed'}`}></div>
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
    </div>
  );
};

export default BrowseTrucks;
