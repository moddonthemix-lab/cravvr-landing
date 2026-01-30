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
};

const BoltView = ({ trucks, loading, onTruckClick }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState(0);
  const [generated, setGenerated] = useState(null);
  const [radius, setRadius] = useState(5);
  const [menuItems, setMenuItems] = useState([]);

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
      {/* Hero Section */}
      <div className="bolt-hero">
        <div className="bolt-hero-bg">
          <div className="bolt-glow glow-1"></div>
          <div className="bolt-glow glow-2"></div>
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
          <h1>Food Adventure</h1>
          <p>Can't decide? Let us pick something amazing for you!</p>
        </div>
      </div>

      {/* Radius Slider */}
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

      {/* Results */}
      {generated && !isGenerating && (
        <div className="bolt-results">
          <div className="result-header">
            <span className="result-icon">⚡</span>
            <h2>Your Adventure Awaits</h2>
          </div>

          {/* Truck Card */}
          <div className="result-card" onClick={() => onTruckClick(generated.truck)}>
            <div className="result-card-glow"></div>
            <div className="result-badge">
              <span className="badge-icon">{Icons.truck}</span>
              Your Random Pick
            </div>
            <div className="result-main">
              <div className="result-image">
                <img src={generated.truck.image} alt={generated.truck.name} />
              </div>
              <div className="result-details">
                <h3>{generated.truck.name}</h3>
                <p className="result-cuisine">{generated.truck.cuisine} • {generated.truck.priceRange}</p>
                <div className="result-stats">
                  <span className="stat">
                    <span className="stat-icon gold">{Icons.star}</span>
                    {generated.truck.rating}
                  </span>
                  <span className="stat">
                    <span className="stat-icon">{Icons.clock}</span>
                    {generated.truck.deliveryTime}
                  </span>
                  <span className="stat">
                    <span className="stat-icon">{Icons.mapPin}</span>
                    {generated.truck.distance}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Picks */}
            <div className="result-menu-picks">
              <h4>
                <span className="picks-icon">{Icons.star}</span>
                Try These Items
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
              <span>Tap to view full menu →</span>
            </div>
          </div>

          {/* Regenerate Button */}
          <button className="bolt-regenerate-btn" onClick={handleGenerate}>
            <span className="regen-icon">⚡</span>
            Generate Again
          </button>
        </div>
      )}
    </div>
  );
};

export default BoltView;
