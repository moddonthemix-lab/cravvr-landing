import React, { useRef, useState, useEffect } from 'react';
import './SocialGraphics.css';

// 2026 Design Trends: Mesh gradients, glassmorphism, bold typography, organic shapes, motion-inspired design

export const StoryGraphic1 = ({ animated = false }) => {
  return (
    <div className="social-graphic story-graphic" id="story-graphic-1">
      {/* Animated mesh gradient background */}
      <div className="mesh-gradient-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="gradient-orb orb-4"></div>
      </div>

      {/* Floating food elements */}
      <div className="floating-elements">
        <span className="float-item item-1">🌮</span>
        <span className="float-item item-2">🍔</span>
        <span className="float-item item-3">🍕</span>
        <span className="float-item item-4">🌯</span>
        <span className="float-item item-5">🍜</span>
      </div>

      {/* Glass card */}
      <div className="glass-card main-card">
        <div className="logo-section">
          <div className="logo-icon">
            <svg viewBox="0 0 48 48" fill="none">
              <rect x="4" y="24" width="40" height="18" rx="4" fill="url(#truckGrad)"/>
              <rect x="8" y="16" width="24" height="12" rx="2" fill="url(#truckGrad)"/>
              <circle cx="14" cy="44" r="4" fill="#1e293b"/>
              <circle cx="36" cy="44" r="4" fill="#1e293b"/>
              <circle cx="14" cy="44" r="2" fill="#64748b"/>
              <circle cx="36" cy="44" r="2" fill="#64748b"/>
              <rect x="28" y="20" width="6" height="6" rx="1" fill="#fff" opacity="0.9"/>
              <defs>
                <linearGradient id="truckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e11d48"/>
                  <stop offset="50%" stopColor="#f43f5e"/>
                  <stop offset="100%" stopColor="#fb7185"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="brand-name gradient-text">cravvr</h1>
        </div>

        <div className="tagline-section">
          <h2 className="main-tagline">Food Trucks</h2>
          <h2 className="main-tagline accent">Without The Fees</h2>
        </div>

        <div className="feature-pills">
          <span className="pill">0% Commission</span>
          <span className="pill">Real-time Tracking</span>
          <span className="pill">Direct Orders</span>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <div className="cta-button">
          <span>Download Now</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="cta-subtext">Available on iOS & Android</p>
      </div>

      {/* Bottom decoration */}
      <div className="bottom-wave">
        <svg viewBox="0 0 1080 200" preserveAspectRatio="none">
          <path d="M0,100 Q270,0 540,100 T1080,100 L1080,200 L0,200 Z" fill="rgba(225,29,72,0.1)"/>
          <path d="M0,120 Q270,20 540,120 T1080,120 L1080,200 L0,200 Z" fill="rgba(225,29,72,0.15)"/>
        </svg>
      </div>
    </div>
  );
};

export const StoryGraphic2 = ({ animated = false }) => {
  return (
    <div className="social-graphic story-graphic dark-theme" id="story-graphic-2">
      {/* Dark mesh background */}
      <div className="mesh-gradient-bg dark">
        <div className="gradient-orb orb-1 dark"></div>
        <div className="gradient-orb orb-2 dark"></div>
        <div className="noise-overlay"></div>
      </div>

      {/* 3D-style stacked cards */}
      <div className="stacked-cards">
        <div className="stat-card card-1">
          <span className="stat-emoji">🚚</span>
          <span className="stat-number">500+</span>
          <span className="stat-label">Food Trucks</span>
        </div>
        <div className="stat-card card-2">
          <span className="stat-emoji">⭐</span>
          <span className="stat-number">4.9</span>
          <span className="stat-label">Avg Rating</span>
        </div>
        <div className="stat-card card-3">
          <span className="stat-emoji">💰</span>
          <span className="stat-number">0%</span>
          <span className="stat-label">Commission</span>
        </div>
      </div>

      {/* Main headline */}
      <div className="headline-section">
        <p className="pre-headline">Introducing</p>
        <h1 className="mega-headline">
          <span className="line-1">Your</span>
          <span className="line-2 gradient-text">Favorite</span>
          <span className="line-3">Food Trucks</span>
        </h1>
        <p className="sub-headline">All in one place. No commissions.</p>
      </div>

      {/* App preview mockup */}
      <div className="phone-mockup">
        <div className="phone-frame">
          <div className="phone-screen">
            <div className="mock-header">
              <span className="mock-logo">cravvr</span>
              <span className="mock-location">📍 San Francisco</span>
            </div>
            <div className="mock-search">What are you craving?</div>
            <div className="mock-trucks">
              <div className="mock-truck-card">
                <div className="mock-img"></div>
                <span>Taco Loco</span>
              </div>
              <div className="mock-truck-card">
                <div className="mock-img"></div>
                <span>Burger Joint</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brand footer */}
      <div className="brand-footer">
        <span className="footer-logo gradient-text">cravvr</span>
        <span className="footer-tagline">Food trucks without the fees</span>
      </div>
    </div>
  );
};

export const SquareGraphic1 = ({ animated = false }) => {
  return (
    <div className="social-graphic square-graphic" id="square-graphic-1">
      {/* Background */}
      <div className="mesh-gradient-bg square">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      {/* Content */}
      <div className="square-content">
        <div className="logo-badge">
          <svg viewBox="0 0 40 40" fill="none">
            <rect x="4" y="20" width="32" height="14" rx="3" fill="url(#sqTruckGrad)"/>
            <rect x="7" y="14" width="18" height="9" rx="2" fill="url(#sqTruckGrad)"/>
            <circle cx="12" cy="36" r="3" fill="#1e293b"/>
            <circle cx="28" cy="36" r="3" fill="#1e293b"/>
            <defs>
              <linearGradient id="sqTruckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e11d48"/>
                <stop offset="100%" stopColor="#fb7185"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="gradient-text">cravvr</span>
        </div>

        <h1 className="square-headline">
          <span>Skip the</span>
          <span className="strike-through">30% fees</span>
        </h1>

        <div className="comparison-visual">
          <div className="compare-item bad">
            <span className="compare-label">Other Apps</span>
            <div className="compare-bar">
              <div className="bar-fill bad" style={{width: '70%'}}></div>
              <span className="bar-text">You keep 70%</span>
            </div>
          </div>
          <div className="compare-item good">
            <span className="compare-label gradient-text">cravvr</span>
            <div className="compare-bar">
              <div className="bar-fill good" style={{width: '100%'}}></div>
              <span className="bar-text">You keep 100%</span>
            </div>
          </div>
        </div>

        <div className="square-cta">
          <span>Join 500+ Food Trucks</span>
        </div>
      </div>
    </div>
  );
};

export const StoryGraphic3 = ({ animated = false }) => {
  return (
    <div className="social-graphic story-graphic testimonial-story" id="story-graphic-3">
      {/* Warm gradient background */}
      <div className="mesh-gradient-bg warm">
        <div className="gradient-orb orb-1 warm"></div>
        <div className="gradient-orb orb-2 warm"></div>
      </div>

      {/* Quote decoration */}
      <div className="quote-decoration">
        <span className="big-quote">"</span>
      </div>

      {/* Testimonial content */}
      <div className="testimonial-content">
        <p className="testimonial-text">
          Finally an app that doesn't take 30% of my earnings. My regulars love the notifications!
        </p>

        <div className="testimonial-author">
          <div className="author-avatar">
            <span>MG</span>
          </div>
          <div className="author-info">
            <span className="author-name">Maria G.</span>
            <span className="author-role">Taco Truck Owner</span>
          </div>
        </div>

        <div className="rating-stars">
          <span>⭐⭐⭐⭐⭐</span>
        </div>
      </div>

      {/* Revenue increase badge */}
      <div className="revenue-badge glass-card">
        <span className="revenue-icon">📈</span>
        <span className="revenue-text">Revenue up <strong>40%</strong></span>
      </div>

      {/* Brand footer */}
      <div className="story-brand-footer">
        <span className="gradient-text">cravvr</span>
        <span className="tagline">Real stories. Real results.</span>
      </div>
    </div>
  );
};

// Main export component with all graphics
const SocialGraphics = () => {
  const [currentGraphic, setCurrentGraphic] = useState(0);
  const graphics = [
    { component: StoryGraphic1, name: 'Story - Hero', id: 'story-graphic-1' },
    { component: StoryGraphic2, name: 'Story - Features', id: 'story-graphic-2' },
    { component: StoryGraphic3, name: 'Story - Testimonial', id: 'story-graphic-3' },
    { component: SquareGraphic1, name: 'Square - Commission', id: 'square-graphic-1' },
  ];

  const CurrentGraphicComponent = graphics[currentGraphic].component;

  return (
    <div className="social-graphics-studio">
      <div className="studio-header">
        <h1>Cravvr Social Media Graphics</h1>
        <p>2026 Design Trends: Mesh Gradients, Glassmorphism, Bold Typography</p>
      </div>

      <div className="graphics-nav">
        {graphics.map((g, i) => (
          <button
            key={i}
            className={`nav-btn ${i === currentGraphic ? 'active' : ''}`}
            onClick={() => setCurrentGraphic(i)}
          >
            {g.name}
          </button>
        ))}
      </div>

      <div className="graphic-preview-container">
        <div className="graphic-wrapper">
          <CurrentGraphicComponent animated={true} />
        </div>
      </div>

      <div className="export-controls">
        <button className="export-btn" id="export-png-btn">
          Export PNG
        </button>
        <button className="export-btn" id="export-mp4-btn">
          Export MP4
        </button>
      </div>
    </div>
  );
};

export default SocialGraphics;
