import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CustomerProfile = ({ onBack }) => {
  const { user, getUserProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editedName, setEditedName] = useState('');
  const [stats, setStats] = useState({ points: 0, favorites: 0, checkIns: 0 });

  const supabase = window.supabaseClient;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      // Get profile from database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      setEditedName(profileData.name);

      // Get customer data (points)
      const { data: customerData } = await supabase
        .from('customers')
        .select('points')
        .eq('id', user.id)
        .single();

      // Get favorites count
      const { count: favCount } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', user.id);

      // Get check-ins count
      const { count: checkInCount } = await supabase
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', user.id);

      setStats({
        points: customerData?.points || 0,
        favorites: favCount || 0,
        checkIns: checkInCount || 0
      });

    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
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
        <p>Loading profile...</p>
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

  const nextReward = 50;
  const progress = (stats.points / nextReward) * 100;
  const pointsUntilReward = nextReward - stats.points;

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
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>My Profile</h1>
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
          {/* Avatar */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e11d48 0%, #f59e0b 100%)',
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

          {/* Name and Email */}
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  border: '2px solid #e11d48',
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

        {/* Edit Profile Button */}
        {isEditing ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSaveProfile}
              style={{
                width: '100%',
                padding: '12px',
                background: '#e11d48',
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
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>⭐</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>
            {stats.points}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Reward Points</div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>❤️</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e11d48', marginBottom: '4px' }}>
            {stats.favorites}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Favorites</div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>✓</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '4px' }}>
            {stats.checkIns}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Check-ins</div>
        </div>
      </div>

      {/* Reward Points Card */}
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        borderRadius: '16px',
        padding: '30px',
        color: 'white',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          Reward Points
        </h3>
        <p style={{ marginBottom: '20px', opacity: 0.9 }}>
          Earn points with every check-in and review!
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <span style={{ fontWeight: '600' }}>Next Reward:</span>
            <span style={{ fontWeight: 'bold' }}>{nextReward} points</span>
          </div>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '10px'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'white',
              transition: 'width 0.3s ease'
            }}></div>
          </div>

          <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
            {pointsUntilReward} points until your next reward!
          </p>
        </div>
      </div>

      {/* Favorite Trucks */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
          Favorite Trucks
        </h3>

        {stats.favorites === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🤍</div>
            <p style={{ fontSize: '16px', marginBottom: '5px' }}>No favorites yet</p>
            <p style={{ fontSize: '14px' }}>Start exploring and save your favorites!</p>
          </div>
        ) : (
          <p>You have {stats.favorites} favorite truck{stats.favorites !== 1 ? 's' : ''}!</p>
        )}
      </div>

      {/* Recent Activity */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
          Recent Activity
        </h3>

        {stats.checkIns === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
            <p>No recent activity</p>
          </div>
        ) : (
          <p>You have {stats.checkIns} check-in{stats.checkIns !== 1 ? 's' : ''}!</p>
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;
