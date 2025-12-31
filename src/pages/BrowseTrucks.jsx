import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const BrowseTrucks = () => {
  const { user } = useAuth();
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [selectedTruck, setSelectedTruck] = useState(null);

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
        .from('food_truck_menus')
        .select('*')
        .eq('food_truck_id', truckId)
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

  // Filter trucks
  const cuisines = ['all', ...new Set(trucks.map(t => t.cuisine))];
  const filteredTrucks = trucks.filter(truck => {
    const matchesSearch = truck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         truck.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine = selectedCuisine === 'all' || truck.cuisine === selectedCuisine;
    return matchesSearch && matchesCuisine;
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
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
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
          ← Back to Browse
        </button>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
            {selectedTruck.name}
          </h1>
          <p style={{ fontSize: '18px', color: '#e11d48', fontWeight: '600', marginBottom: '16px' }}>
            {selectedTruck.cuisine}
          </p>
          {selectedTruck.description && (
            <p style={{ color: '#666', marginBottom: '16px' }}>{selectedTruck.description}</p>
          )}
          {selectedTruck.location && (
            <p style={{ color: '#666', fontSize: '14px' }}>📍 {selectedTruck.location}</p>
          )}
          {selectedTruck.phone && (
            <p style={{ color: '#666', fontSize: '14px' }}>📞 {selectedTruck.phone}</p>
          )}
        </div>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Menu</h2>

          {selectedTruck.menu.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
              No menu items yet
            </p>
          ) : (
            Object.keys(groupedMenu).map(category => (
              <div key={category} style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', color: '#374151' }}>
                  {category}
                </h3>
                {groupedMenu[category].map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: '16px 0',
                      borderBottom: '1px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                        {item.name}
                      </h4>
                      {item.description && (
                        <p style={{ fontSize: '14px', color: '#666' }}>{item.description}</p>
                      )}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#e11d48', marginLeft: '20px' }}>
                      ${item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Browse View
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '30px' }}>
        Browse Food Trucks
      </h1>

      {/* Search and Filters */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <input
          type="text"
          placeholder="Search trucks by name or cuisine..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '16px',
            marginBottom: '16px'
          }}
        />

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {cuisines.map(cuisine => (
            <button
              key={cuisine}
              onClick={() => setSelectedCuisine(cuisine)}
              style={{
                padding: '8px 16px',
                background: selectedCuisine === cuisine ? '#e11d48' : '#f3f4f6',
                color: selectedCuisine === cuisine ? 'white' : '#374151',
                border: 'none',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {cuisine === 'all' ? 'All' : cuisine}
            </button>
          ))}
        </div>
      </div>

      {/* Trucks Grid */}
      {filteredTrucks.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '60px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚚</div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
            No trucks found
          </h3>
          <p style={{ color: '#666' }}>
            {searchQuery || selectedCuisine !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Be the first to add a food truck!'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {filteredTrucks.map(truck => (
            <div
              key={truck.id}
              onClick={() => handleTruckClick(truck)}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                {truck.name}
              </h3>
              <p style={{ fontSize: '14px', color: '#e11d48', fontWeight: '600', marginBottom: '12px' }}>
                {truck.cuisine}
              </p>
              {truck.description && (
                <p style={{
                  fontSize: '14px',
                  color: '#666',
                  marginBottom: '12px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {truck.description}
                </p>
              )}
              {truck.location && (
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>📍 {truck.location}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseTrucks;
