import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { Icons } from '../common/Icons';
import './BoltView.css';

// Usage limits
const SIGNED_IN_DAILY_LIMIT = 5;
const GUEST_TOTAL_LIMIT = 1;

const getStorageKey = (userId) => userId ? `bolt_usage_${userId}` : 'bolt_usage_guest';
const getTodayDate = () => new Date().toISOString().split('T')[0];

const getUsageData = (userId) => {
  const key = getStorageKey(userId);
  const stored = localStorage.getItem(key);
  if (!stored) return { count: 0, date: getTodayDate() };
  try {
    return JSON.parse(stored);
  } catch {
    return { count: 0, date: getTodayDate() };
  }
};

const setUsageData = (userId, data) => {
  const key = getStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(data));
};

const BoltView = ({ trucks, loading, onTruckClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [usageCount, setUsageCount] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);

  // Check usage on mount and when user changes
  useEffect(() => {
    const usage = getUsageData(user?.id);
    const today = getTodayDate();

    if (user) {
      // Signed in user: reset count if new day
      if (usage.date !== today) {
        setUsageData(user.id, { count: 0, date: today });
        setUsageCount(0);
        setIsLimitReached(false);
      } else {
        setUsageCount(usage.count);
        setIsLimitReached(usage.count >= SIGNED_IN_DAILY_LIMIT);
      }
    } else {
      // Guest: check total lifetime usage
      setUsageCount(usage.count);
      setIsLimitReached(usage.count >= GUEST_TOTAL_LIMIT);
    }
  }, [user]);

  const getRemainingUses = () => {
    if (user) {
      return Math.max(0, SIGNED_IN_DAILY_LIMIT - usageCount);
    }
    return Math.max(0, GUEST_TOTAL_LIMIT - usageCount);
  };

  const incrementUsage = () => {
    const today = getTodayDate();
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    setUsageData(user?.id, { count: newCount, date: today });

    // Check if limit now reached
    const limit = user ? SIGNED_IN_DAILY_LIMIT : GUEST_TOTAL_LIMIT;
    if (newCount >= limit) {
      setIsLimitReached(true);
    }
  };

  const fetchMenuItems = async (truckId) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('truck_id', truckId)
        .limit(10);

      if (!error && data) {
        return data.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || 'A delicious menu item.',
          price: `$${item.price?.toFixed(2) || '0.00'}`,
          emoji: item.emoji || '🍽️',
        }));
      }
    } catch (err) {
      console.error('Error fetching menu:', err);
    }
    return [];
  };

  const handleGenerate = async () => {
    if (trucks.length === 0) return;
    if (isLimitReached) return;

    setIsGenerating(true);
    setGenerated(null);

    setTimeout(async () => {
      const randomTruck = trucks[Math.floor(Math.random() * trucks.length)];
      const items = await fetchMenuItems(randomTruck.id);

      let selectedItems = [];
      if (items.length >= 2) {
        const shuffled = [...items].sort(() => Math.random() - 0.5);
        selectedItems = shuffled.slice(0, 2);
      } else if (items.length === 1) {
        selectedItems = items;
      } else {
        selectedItems = [
          { id: 1, name: 'Signature Special', description: 'Our most popular dish', price: '$12.99', emoji: '🌟' },
          { id: 2, name: 'Chef\'s Choice', description: 'Today\'s recommended pick', price: '$14.99', emoji: '👨‍🍳' },
        ];
      }

      // Increment usage after successful generation
      incrementUsage();

      setGenerated({ truck: randomTruck, items: selectedItems });
      setIsGenerating(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="bolt-page">
        <div className="bolt-loading">
          <div className="spinner"></div>
          <p>Loading trucks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bolt-page">
      {/* Background */}
      <div className="bolt-bg">
        <div className="bolt-bg-gradient"></div>
        <div className="bolt-bg-pattern"></div>
      </div>

      {/* Content */}
      <div className="bolt-content">
        {/* Header */}
        <div className="bolt-header">
          <div className={`bolt-logo ${isGenerating ? 'spinning' : ''}`}>
            <div className="bolt-logo-ring"></div>
            <div className="bolt-logo-icon">
              {Icons.bolt}
            </div>
          </div>
          <h1>Bolt</h1>
          <p>Instant food truck discovery</p>

          {/* Usage Counter */}
          <div className="bolt-usage">
            {user ? (
              <span className="usage-badge">
                {Icons.bolt}
                <span>{getRemainingUses()} of {SIGNED_IN_DAILY_LIMIT} left today</span>
              </span>
            ) : (
              <span className="usage-badge guest">
                {Icons.user}
                <span>{getRemainingUses() > 0 ? '1 free try' : 'Sign up for more'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Main Area */}
        <div className="bolt-main">
          {/* Limit Reached State */}
          {isLimitReached && !generated && !isGenerating && (
            <div className="bolt-limit-reached">
              <div className="limit-icon">
                {Icons.lock}
              </div>
              {user ? (
                <>
                  <h2>Daily Limit Reached</h2>
                  <p>You've used all 5 Bolt picks for today. Come back tomorrow for more instant discoveries!</p>
                  <div className="limit-info">
                    <span>Resets at midnight</span>
                  </div>
                </>
              ) : (
                <>
                  <h2>Want More Picks?</h2>
                  <p>Sign up for a free account to get 5 Bolt picks every day!</p>
                  <button className="bolt-btn signup" onClick={() => navigate('/eat')}>
                    <span className="bolt-btn-icon">{Icons.user}</span>
                    <span>Sign Up Free</span>
                  </button>
                  <p className="limit-subtext">Already have an account? <button className="link-btn" onClick={() => navigate('/eat')}>Sign in</button></p>
                </>
              )}
            </div>
          )}

          {/* Initial State */}
          {!generated && !isGenerating && !isLimitReached && (
            <div className="bolt-initial">
              <div className="bolt-card-preview">
                <div className="preview-shimmer"></div>
                <div className="preview-content">
                  <div className="preview-icon">{Icons.truck}</div>
                  <span>Your next meal awaits</span>
                </div>
              </div>

              <button className="bolt-btn" onClick={handleGenerate}>
                <span className="bolt-btn-icon">{Icons.bolt}</span>
                <span>Generate Pick</span>
              </button>

              <p className="bolt-subtext">{trucks.length} trucks available nearby</p>
            </div>
          )}

          {/* Generating State */}
          {isGenerating && (
            <div className="bolt-generating">
              <div className="generating-cards">
                <div className="gen-card card-1"></div>
                <div className="gen-card card-2"></div>
                <div className="gen-card card-3"></div>
              </div>
              <p>Finding your perfect match...</p>
            </div>
          )}

          {/* Result State */}
          {generated && !isGenerating && (
            <div className="bolt-result">
              <div className="result-badge">
                <span className="badge-bolt">{Icons.bolt}</span>
                <span>Your Pick</span>
              </div>

              <div className="result-card" onClick={() => onTruckClick(generated.truck)}>
                <div className="result-card-image">
                  <img src={generated.truck.image} alt={generated.truck.name} />
                  <div className="result-card-overlay"></div>
                </div>

                <div className="result-card-content">
                  <div className="result-card-header">
                    <div>
                      <h2>{generated.truck.name}</h2>
                      <p className="result-cuisine">{generated.truck.cuisine}</p>
                    </div>
                    <div className="result-rating">
                      <span className="rating-star">{Icons.star}</span>
                      <span>{generated.truck.rating}</span>
                    </div>
                  </div>

                  <div className="result-meta">
                    <div className="meta-item">
                      <span className="meta-icon">{Icons.clock}</span>
                      <span>{generated.truck.deliveryTime}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">{Icons.mapPin}</span>
                      <span>{generated.truck.distance}</span>
                    </div>
                    <div className="meta-item price">
                      <span>{generated.truck.priceRange}</span>
                    </div>
                  </div>

                  <div className="result-divider"></div>

                  <div className="result-picks">
                    <span className="picks-label">Try these:</span>
                    <div className="picks-items">
                      {generated.items.map(item => (
                        <div key={item.id} className="pick-chip">
                          <span className="pick-emoji">{item.emoji}</span>
                          <span className="pick-name">{item.name}</span>
                          <span className="pick-price">{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="result-cta">
                    <span>View Menu</span>
                    <span className="cta-arrow">{Icons.arrowRight}</span>
                  </div>
                </div>
              </div>

              <button
                className={`bolt-btn secondary ${isLimitReached ? 'disabled' : ''}`}
                onClick={handleGenerate}
                disabled={isLimitReached}
              >
                <span className="bolt-btn-icon">{Icons.refresh}</span>
                <span>{isLimitReached ? 'Limit Reached' : 'Try Again'}</span>
              </button>
              {isLimitReached && !user && (
                <p className="result-limit-msg">
                  <button className="link-btn" onClick={() => navigate('/eat')}>Sign up</button> for 5 daily picks
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoltView;
