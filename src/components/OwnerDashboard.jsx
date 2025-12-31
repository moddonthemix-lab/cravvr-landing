import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MenuManagement from './MenuManagement';

const OwnerDashboard = ({ onBack }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [stats, setStats] = useState({ views: 0, favorites: 0, messages: 0 });
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'menu'
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [showTruckForm, setShowTruckForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [truckForm, setTruckForm] = useState({
    name: '',
    cuisine: '',
    description: '',
    phone: '',
    location: ''
  });

  const supabase = window.supabaseClient;

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(false);

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);
      setEditedName(profileData?.name);

      // Get owner's trucks
      const { data: ownerData } = await supabase
        .from('owners')
        .select('id')
        .eq('id', user.id)
        .single();

      if (ownerData) {
        const { data: trucksData } = await supabase
          .from('food_trucks')
          .select('*')
          .eq('owner_id', ownerData.id);

        setTrucks(trucksData || []);
      }

      // Mock stats for now
      setStats({
        views: 247,
        favorites: 34,
        messages: 12
      });

    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: editedName })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({ ...profile, name: editedName });
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleAddTruck = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('food_trucks')
        .insert({
          owner_id: user.id,
          name: truckForm.name,
          cuisine: truckForm.cuisine,
          description: truckForm.description || null,
          phone: truckForm.phone || null,
          location: truckForm.location || null
        })
        .select()
        .single();

      if (error) throw error;

      setTrucks([...trucks, data]);
      setTruckForm({ name: '', cuisine: '', description: '', phone: '', location: '' });
      setShowTruckForm(false);
      alert('Truck added successfully!');
    } catch (error) {
      console.error('Error adding truck:', error);
      alert('Failed to add truck: ' + error.message);
    }
  };

  const handleUpdateTruck = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('food_trucks')
        .update({
          name: truckForm.name,
          cuisine: truckForm.cuisine,
          description: truckForm.description || null,
          phone: truckForm.phone || null,
          location: truckForm.location || null
        })
        .eq('id', editingTruck.id)
        .select()
        .single();

      if (error) throw error;

      setTrucks(trucks.map(t => t.id === editingTruck.id ? data : t));
      setTruckForm({ name: '', cuisine: '', description: '', phone: '', location: '' });
      setEditingTruck(null);
      setShowTruckForm(false);
      alert('Truck updated successfully!');
    } catch (error) {
      console.error('Error updating truck:', error);
      alert('Failed to update truck: ' + error.message);
    }
  };

  const startEditTruck = (truck) => {
    setEditingTruck(truck);
    setTruckForm({
      name: truck.name,
      cuisine: truck.cuisine,
      description: truck.description || '',
      phone: truck.phone || '',
      location: truck.location || ''
    });
    setShowTruckForm(true);
  };

  const cancelTruckForm = () => {
    setShowTruckForm(false);
    setEditingTruck(null);
    setTruckForm({ name: '', cuisine: '', description: '', phone: '', location: '' });
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Show Menu Management view if selected
  if (currentView === 'menu' && selectedTruck) {
    return (
      <MenuManagement
        truckId={selectedTruck.id}
        truckName={selectedTruck.name}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '30px',
        gap: '15px'
      }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '5px'
            }}
          >
            ←
          </button>
        )}
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>Owner Dashboard</h1>
      </div>

      {/* Profile Card */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'white',
            marginRight: '20px'
          }}>
            {getInitials(profile?.name)}
          </div>

          <div style={{ flex: 1 }}>
            {isEditing ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  border: '2px solid #8b5cf6',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginBottom: '8px',
                  width: '100%',
                  maxWidth: '300px'
                }}
              />
            ) : (
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                {profile?.name}
              </h2>
            )}
            <p style={{ color: '#666', margin: 0 }}>{profile?.email}</p>
          </div>
        </div>

        {isEditing ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSaveProfile}
              style={{
                width: '100%',
                padding: '12px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Save Changes
            </button>
            <button
              onClick={() => {
                setEditedName(profile.name);
                setIsEditing(false);
              }}
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
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'white',
              color: '#374151',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '4px' }}>
            {stats.views}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Views Today</div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e11d48', marginBottom: '4px' }}>
            {stats.favorites}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>Favorites</div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '4px' }}>
            {stats.messages}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>Messages</div>
        </div>
      </div>

      {/* My Trucks */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>My Trucks</h3>
          {!showTruckForm && (
            <button
              onClick={() => setShowTruckForm(true)}
              style={{
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              + Add Truck
            </button>
          )}
        </div>

        {/* Add/Edit Truck Form */}
        {showTruckForm && (
          <div style={{
            background: '#f9fafb',
            border: '2px solid #8b5cf6',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px'
          }}>
            <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              {editingTruck ? 'Edit Truck' : 'Add New Truck'}
            </h4>
            <form onSubmit={editingTruck ? handleUpdateTruck : handleAddTruck}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
                    Truck Name *
                  </label>
                  <input
                    type="text"
                    value={truckForm.name}
                    onChange={(e) => setTruckForm({ ...truckForm, name: e.target.value })}
                    required
                    placeholder="e.g., Seoul Street Food"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
                    Cuisine Type *
                  </label>
                  <input
                    type="text"
                    value={truckForm.cuisine}
                    onChange={(e) => setTruckForm({ ...truckForm, cuisine: e.target.value })}
                    required
                    placeholder="e.g., Korean BBQ"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
                    Description
                  </label>
                  <textarea
                    value={truckForm.description}
                    onChange={(e) => setTruckForm({ ...truckForm, description: e.target.value })}
                    placeholder="Tell customers about your truck..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={truckForm.phone}
                      onChange={(e) => setTruckForm({ ...truckForm, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
                      Location
                    </label>
                    <input
                      type="text"
                      value={truckForm.location}
                      onChange={(e) => setTruckForm({ ...truckForm, location: e.target.value })}
                      placeholder="San Francisco, CA"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {editingTruck ? 'Update Truck' : 'Add Truck'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelTruckForm}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {trucks.length === 0 && !showTruckForm ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#9ca3af',
            border: '2px dashed #e5e7eb',
            borderRadius: '12px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🚚</div>
            <p style={{ fontSize: '16px', marginBottom: '5px' }}>No trucks yet</p>
            <p style={{ fontSize: '14px' }}>Add your first food truck to get started!</p>
          </div>
        ) : (
          trucks.map(truck => (
            <div key={truck.id} style={{
              padding: '20px',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              marginBottom: '15px'
            }}>
              <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                {truck.name}
              </h4>
              <p style={{ color: '#666', marginBottom: '12px' }}>{truck.cuisine}</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => startEditTruck(truck)}
                  style={{
                    padding: '8px 16px',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setSelectedTruck(truck);
                    setCurrentView('menu');
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Manage Menu
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Truck Status */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
          Truck Status
        </h3>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Currently</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Let customers know if you're serving</div>
          </div>
          <button
            onClick={() => alert('Truck Status toggle feature coming soon! This will let you toggle between Open and Closed status.')}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 20px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ● OPEN
          </button>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '15px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Share Location</div>
            <div style={{ fontSize: '14px', color: '#666' }}>GPS tracking (optional)</div>
          </div>
          <label style={{
            position: 'relative',
            display: 'inline-block',
            width: '50px',
            height: '28px'
          }}>
            <input
              type="checkbox"
              onChange={(e) => alert('Share Location toggle feature coming soon! This will enable GPS tracking of your truck.')}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: '#8b5cf6',
              borderRadius: '28px',
              transition: '0.4s'
            }}></span>
          </label>
        </div>
      </div>

      {/* Business Hours */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
          Business Hours
        </h3>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <div>
            <div style={{ fontWeight: '600' }}>Today's Hours:</div>
          </div>
          <div style={{ fontWeight: 'bold', color: '#10b981' }}>Open 24/7</div>
        </div>

        <button
          onClick={() => alert('Edit Weekly Schedule feature coming soon! This will let you set your operating hours for each day.')}
          style={{
            width: '100%',
            padding: '12px',
            background: 'white',
            color: '#374151',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Edit Weekly Schedule
        </button>
      </div>

      {/* Quick Actions */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
          Quick Actions
        </h3>

        <div style={{ display: 'grid', gap: '12px' }}>
          <button
            onClick={() => alert('Update Photos feature coming soon! This will let you upload images of your truck and food.')}
            style={{
              width: '100%',
              padding: '16px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>📸 Update Photos</span>
            <span style={{ fontSize: '20px', color: '#9ca3af' }}>→</span>
          </button>

          <button
            onClick={() => alert('Edit Description feature coming soon! This will let you update your truck\'s bio and story.')}
            style={{
              width: '100%',
              padding: '16px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>✏️ Edit Description</span>
            <span style={{ fontSize: '20px', color: '#9ca3af' }}>→</span>
          </button>

          <button
            onClick={() => alert('Manage Locations feature coming soon! This will let you set your regular locations and routes.')}
            style={{
              width: '100%',
              padding: '16px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>📍 Manage Locations</span>
            <span style={{ fontSize: '20px', color: '#9ca3af' }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
