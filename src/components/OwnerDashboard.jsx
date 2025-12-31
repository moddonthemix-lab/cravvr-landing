import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const OwnerDashboard = ({ onBack }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [stats, setStats] = useState({ views: 0, favorites: 0, messages: 0 });

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

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading dashboard...</p>
      </div>
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
          <button style={{
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            + Add Truck
          </button>
        </div>

        {trucks.length === 0 ? (
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
                <button style={{
                  padding: '8px 16px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}>
                  Edit
                </button>
                <button style={{
                  padding: '8px 16px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}>
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
          <button style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
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
            <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} />
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

        <button style={{
          width: '100%',
          padding: '12px',
          background: 'white',
          color: '#374151',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer'
        }}>
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
          <button style={{
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
          }}>
            <span>📸 Update Photos</span>
            <span style={{ fontSize: '20px', color: '#9ca3af' }}>→</span>
          </button>

          <button style={{
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
          }}>
            <span>✏️ Edit Description</span>
            <span style={{ fontSize: '20px', color: '#9ca3af' }}>→</span>
          </button>

          <button style={{
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
          }}>
            <span>📍 Manage Locations</span>
            <span style={{ fontSize: '20px', color: '#9ca3af' }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
