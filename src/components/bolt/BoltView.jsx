import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import './BoltView.css';

// Icons
const Icons = {
  bolt: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  truck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  mapPin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  sparkles: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/></svg>,
  shuffle: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>,
  heart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  arrowRight: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

const BoltView = ({ trucks, loading, onTruckClick }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState(0);
  const [generated, setGenerated] = useState(null);
  const [radius, setRadius] = useState(5);

  // Fetch menu items for selected truck
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

    setIsGenerating(true);
    setGenerated(null);
    setGenerationPhase(1);

    // Phase timing
    setTimeout(() => setGenerationPhase(2), 400);
    setTimeout(() => setGenerationPhase(3), 800);

    // Complete generation
    setTimeout(async () => {
      // Pick random truck
      const randomTruck = trucks[Math.floor(Math.random() * trucks.length)];

      // Fetch menu items for this truck
      const items = await fetchMenuItems(randomTruck.id);

      // Pick 2 random items (or use defaults)
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

      setGenerated({
        truck: randomTruck,
        items: selectedItems,
      });
      setIsGenerating(false);
      setGenerationPhase(0);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="bolt-view">
        <div className="bolt-loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bolt-view">
      <div className="bolt-desktop-layout">
        {/* Left Column - Hero & Controls */}
        <div className="bolt-left-column">
          {/* Hero Section */}
          <div className="bolt-hero">
            <div className="bolt-hero-bg">
              <div className="bolt-glow glow-1"></div>
              <div className="bolt-glow glow-2"></div>
              <div className="bolt-glow glow-3"></div>
            </div>
            <div className="bolt-hero-content">
              <div className={`bolt-icon-container ${isGenerating ? 'generating' : ''}`}>
                <div className="bolt-ring ring-1"></div>
                <div className="bolt-ring ring-2"></div>
                <div className="bolt-ring ring-3"></div>
                <div className="bolt-icon-inner">
                  {Icons.bolt}
                </div>
              </div>
              <h1>Bolt</h1>
              <p className="bolt-tagline">Can't decide? Let us pick something amazing for you!</p>
            </div>
          </div>

          {/* Feature Pills - Desktop Only */}
          <div className="bolt-features">
            <div className="feature-pill">
              <span className="feature-icon">{Icons.shuffle}</span>
              <span>Random Selection</span>
            </div>
            <div className="feature-pill">
              <span className="feature-icon">{Icons.sparkles}</span>
              <span>AI-Powered Picks</span>
            </div>
            <div className="feature-pill">
              <span className="feature-icon">{Icons.heart}</span>
              <span>Personalized</span>
            </div>
          </div>

          {/* Controls */}
          {!isGenerating && !generated && (
            <div className="bolt-controls">
              <div className="radius-control">
                <label>
                  Search radius: <strong>{radius} miles</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="radius-slider"
                />
                <div className="radius-labels">
                  <span>1 mi</span>
                  <span>10 mi</span>
                </div>
              </div>

              <button className="bolt-generate-btn" onClick={handleGenerate}>
                <span className="btn-icon">{Icons.bolt}</span>
                Generate My Pick
              </button>

              <p className="bolt-hint">Press the button and let fate decide your next meal</p>
            </div>
          )}

          {/* Generation Progress */}
          {isGenerating && (
            <div className="bolt-generating">
              <div className="generation-steps">
                <div className={`gen-step ${generationPhase >= 1 ? 'active' : ''}`}>
                  <span className="step-icon">{Icons.search}</span>
                  <span>Scanning nearby...</span>
                </div>
                <div className={`gen-step ${generationPhase >= 2 ? 'active' : ''}`}>
                  <span className="step-icon">{Icons.truck}</span>
                  <span>Finding trucks...</span>
                </div>
                <div className={`gen-step ${generationPhase >= 3 ? 'active' : ''}`}>
                  <span className="step-icon">{Icons.bolt}</span>
                  <span>Generating picks...</span>
                </div>
              </div>
            </div>
          )}

          {/* Regenerate Button - Left Column on Desktop */}
          {generated && !isGenerating && (
            <div className="bolt-controls">
              <button className="bolt-regenerate-btn" onClick={handleGenerate}>
                <span className="regen-icon">⚡</span>
                Generate Again
              </button>
              <p className="bolt-hint">Not feeling it? Try another random pick!</p>
            </div>
          )}
        </div>

        {/* Right Column - Results */}
        <div className="bolt-right-column">
          {/* Empty State */}
          {!generated && !isGenerating && (
            <div className="bolt-empty-state">
              <div className="empty-illustration">
                <div className="empty-truck-icon">{Icons.truck}</div>
                <div className="empty-bolt-icon">{Icons.bolt}</div>
              </div>
              <h3>Ready for an Adventure?</h3>
              <p>Click "Generate My Pick" to discover a random food truck and menu items curated just for you.</p>
              <div className="empty-stats">
                <div className="empty-stat">
                  <strong>{trucks.length}</strong>
                  <span>Trucks Available</span>
                </div>
                <div className="empty-stat">
                  <strong>∞</strong>
                  <span>Possibilities</span>
                </div>
              </div>
            </div>
          )}

          {/* Generating State */}
          {isGenerating && (
            <div className="bolt-generating-visual">
              <div className="generating-animation">
                <div className="spin-ring"></div>
                <div className="spin-ring delay-1"></div>
                <div className="spin-ring delay-2"></div>
                <span className="generating-bolt">{Icons.bolt}</span>
              </div>
              <p>Finding the perfect pick...</p>
            </div>
          )}

          {/* Results */}
          {generated && !isGenerating && (
            <div className="bolt-results">
              <div className="result-header">
                <span className="result-icon">⚡</span>
                <h2>Your Pick is Ready!</h2>
              </div>

              {/* Truck Card */}
              <div className="result-card" onClick={() => onTruckClick(generated.truck)}>
                <div className="result-card-glow"></div>

                {/* Large Image */}
                <div className="result-hero-image">
                  <img src={generated.truck.image} alt={generated.truck.name} />
                  <div className="result-image-overlay"></div>
                  <div className="result-badge">
                    <span className="badge-icon">{Icons.bolt}</span>
                    Your Random Pick
                  </div>
                  <div className="result-hero-info">
                    <h3>{generated.truck.name}</h3>
                    <p className="result-cuisine">{generated.truck.cuisine} • {generated.truck.priceRange}</p>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="result-stats-row">
                  <div className="stat-item">
                    <span className="stat-icon gold">{Icons.star}</span>
                    <div className="stat-text">
                      <strong>{generated.truck.rating}</strong>
                      <span>Rating</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">{Icons.clock}</span>
                    <div className="stat-text">
                      <strong>{generated.truck.deliveryTime}</strong>
                      <span>Delivery</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">{Icons.mapPin}</span>
                    <div className="stat-text">
                      <strong>{generated.truck.distance}</strong>
                      <span>Away</span>
                    </div>
                  </div>
                </div>

                {/* Menu Picks */}
                <div className="result-menu-picks">
                  <h4>
                    <span className="picks-icon">{Icons.sparkles}</span>
                    Recommended Items
                  </h4>
                  <div className="picks-list">
                    {generated.items.map(item => (
                      <div key={item.id} className="pick-item">
                        <span className="pick-emoji">{item.emoji}</span>
                        <div className="pick-info">
                          <strong>{item.name}</strong>
                          <span>{item.description}</span>
                        </div>
                        <span className="pick-price">{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="result-cta">
                  <span>View Full Menu</span>
                  <span className="cta-arrow">{Icons.arrowRight}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoltView;
