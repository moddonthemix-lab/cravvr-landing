import React from 'react';
import { Icons } from '../common/Icons';
import './PunchCard.css';

/**
 * Realistic paper-style punch card component
 * Displays loyalty progress with punch holes and Cravrr branding
 */
const PunchCard = ({ truckName, punches, total = 10, reward = 'Free Item', onClaim }) => {
  const filledPunches = punches % total;
  const isRewardReady = punches >= total;
  const completedCards = Math.floor(punches / total);

  return (
    <div className={`paper-punch-card ${isRewardReady ? 'reward-ready' : ''}`}>
      {/* Perforated edge decoration */}
      <div className="card-perforation top" />

      {/* Card header with logo */}
      <div className="card-header">
        <div className="card-logo">
          <img src="/logo/apple-touch-icon.png" alt="Cravrr" />
        </div>
        <div className="card-title">
          <span className="card-brand">CRAVRR</span>
          <span className="card-type">LOYALTY CARD</span>
        </div>
      </div>

      {/* Truck name */}
      <div className="card-truck-name">
        <span className="truck-label">Valid at</span>
        <h3>{truckName}</h3>
      </div>

      {/* Punch holes grid */}
      <div className="punch-holes-container">
        <div className="punch-holes-grid">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`punch-hole ${i < filledPunches || isRewardReady ? 'punched' : ''}`}
            >
              {(i < filledPunches || isRewardReady) && (
                <div className="punch-stamp">
                  <img src="/logo/apple-touch-icon.png" alt="" className="stamp-logo" />
                </div>
              )}
              <span className="hole-number">{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="card-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(filledPunches / total) * 100}%` }}
          />
        </div>
        <span className="progress-text">
          {isRewardReady ? 'COMPLETE!' : `${filledPunches} of ${total} punches`}
        </span>
      </div>

      {/* Reward section */}
      <div className="card-reward-section">
        <div className="reward-badge">
          {Icons.gift}
        </div>
        <div className="reward-info">
          <span className="reward-label">Your Reward</span>
          <span className="reward-value">{reward}</span>
        </div>
        {completedCards > 0 && (
          <div className="completed-badge">
            {completedCards}x
          </div>
        )}
      </div>

      {/* Claim button when reward is ready */}
      {isRewardReady && (
        <button className="claim-reward-btn" onClick={onClaim}>
          {Icons.gift}
          <span>Claim Reward</span>
        </button>
      )}

      {/* Card footer */}
      <div className="card-footer">
        <span className="card-terms">Buy {total}, get 1 free!</span>
        <span className="card-id">#{Math.random().toString(36).substr(2, 8).toUpperCase()}</span>
      </div>

      {/* Perforated edge decoration */}
      <div className="card-perforation bottom" />
    </div>
  );
};

export default PunchCard;
