import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '..', 'social-exports');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// New Cravvr logo - C-shaped pizza pin
const logoSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 250">
  <defs>
    <linearGradient id="pinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#dc2626"/>
    </linearGradient>
    <linearGradient id="pinShade" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#b91c1c"/>
      <stop offset="100%" stop-color="#dc2626"/>
    </linearGradient>
  </defs>
  <ellipse cx="100" cy="242" rx="45" ry="6" fill="#00000015"/>
  <g>
    <path d="M 100 230 C 70 200, 30 170, 30 110 C 30 50, 70 20, 120 20 C 150 20, 170 35, 170 35 L 145 70 C 145 70, 130 55, 110 55 C 75 55, 60 80, 60 110 C 60 145, 85 170, 100 195 C 115 170, 140 145, 140 115 C 140 100, 135 90, 125 85 L 150 50 C 165 60, 170 80, 170 110 C 170 170, 130 200, 100 230 Z" fill="url(#pinGrad)"/>
    <path d="M 30 110 C 30 50, 70 20, 120 20 C 150 20, 170 35, 170 35 L 145 70 C 145 70, 130 55, 110 55 C 75 55, 60 80, 60 110 L 30 110 Z" fill="url(#pinShade)" opacity="0.3"/>
    <circle cx="125" cy="165" r="12" fill="white"/>
    <g transform="translate(95, -5) rotate(25)">
      <path d="M 0 50 C 25 15, 75 15, 100 50 L 50 95 Z" fill="#dc2626"/>
      <path d="M 8 48 C 30 22, 70 22, 92 48 L 50 88 Z" fill="#fef3c7"/>
      <circle cx="35" cy="45" r="8" fill="#dc2626"/>
      <circle cx="55" cy="38" r="7" fill="#dc2626"/>
      <circle cx="70" cy="50" r="6" fill="#dc2626"/>
      <circle cx="50" cy="60" r="7" fill="#dc2626"/>
      <circle cx="45" cy="75" r="5" fill="#dc2626"/>
      <path d="M 15 52 Q 12 62, 18 68" fill="none" stroke="#fef3c7" stroke-width="4" stroke-linecap="round"/>
      <path d="M 30 55 Q 28 68, 35 78" fill="none" stroke="#fef3c7" stroke-width="3" stroke-linecap="round"/>
      <path d="M 70 55 Q 72 65, 68 72" fill="none" stroke="#fef3c7" stroke-width="3" stroke-linecap="round"/>
    </g>
  </g>
</svg>`;

// The complete standalone HTML with all graphics embedded
const graphicsHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; -webkit-font-smoothing: antialiased; }

    .social-graphic { position: relative; overflow: hidden; }
    .story-graphic { width: 1080px; height: 1920px; background: #fafbfc; }
    .square-graphic { width: 1080px; height: 1080px; background: #fafbfc; }

    /* Mesh gradient backgrounds */
    .mesh-gradient-bg {
      position: absolute; inset: 0;
      background: linear-gradient(135deg, #fff5f5 0%, #fdf2f8 25%, #fce7f3 50%, #fff1f2 75%, #ffffff 100%);
      overflow: hidden;
    }
    .mesh-gradient-bg.dark {
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 25%, #16213e 50%, #1a1a2e 75%, #0f0f1a 100%);
    }
    .mesh-gradient-bg.warm {
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 25%, #fde68a 50%, #fef3c7 75%, #fffbeb 100%);
    }

    .gradient-orb {
      position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.7;
      animation: float-orb 8s ease-in-out infinite;
    }
    .orb-1 { width: 600px; height: 600px; background: radial-gradient(circle, #e11d48 0%, transparent 70%); top: -10%; left: -10%; }
    .orb-2 { width: 500px; height: 500px; background: radial-gradient(circle, #f43f5e 0%, transparent 70%); bottom: 20%; right: -15%; animation-delay: -2s; }
    .orb-3 { width: 400px; height: 400px; background: radial-gradient(circle, #fb7185 0%, transparent 70%); bottom: -5%; left: 20%; animation-delay: -4s; }
    .orb-4 { width: 350px; height: 350px; background: radial-gradient(circle, #fda4af 0%, transparent 70%); top: 30%; right: 30%; animation-delay: -6s; }
    .orb-1.dark { background: radial-gradient(circle, #e11d48 0%, transparent 70%); opacity: 0.5; }
    .orb-2.dark { background: radial-gradient(circle, #7c3aed 0%, transparent 70%); opacity: 0.4; }
    .orb-1.warm { background: radial-gradient(circle, #f97316 0%, transparent 70%); }
    .orb-2.warm { background: radial-gradient(circle, #e11d48 0%, transparent 70%); }

    @keyframes float-orb {
      0%, 100% { transform: translate(0, 0) scale(1); }
      25% { transform: translate(30px, -30px) scale(1.05); }
      50% { transform: translate(-20px, 20px) scale(0.95); }
      75% { transform: translate(20px, 30px) scale(1.02); }
    }

    /* Glass cards */
    .glass-card {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 32px;
      box-shadow: 0 8px 32px rgba(225, 29, 72, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    /* Typography */
    .gradient-text {
      background: linear-gradient(135deg, #e11d48 0%, #f43f5e 50%, #fb7185 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .brand-name { font-size: 96px; font-weight: 800; letter-spacing: -3px; margin: 0; }
    .main-tagline { font-size: 72px; font-weight: 800; letter-spacing: -2px; color: #0f172a; margin: 0; line-height: 1.1; }
    .main-tagline.accent { background: linear-gradient(135deg, #e11d48 0%, #f43f5e 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

    /* Story 1 Hero */
    #story-graphic-1 { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px; }
    #story-graphic-1 .main-card { position: relative; z-index: 10; padding: 80px 60px; display: flex; flex-direction: column; align-items: center; gap: 48px; max-width: 900px; }
    .logo-section { display: flex; flex-direction: column; align-items: center; gap: 24px; }
    .logo-icon { width: 200px; height: 250px; }
    .logo-icon svg { width: 100%; height: 100%; }
    .tagline-section { text-align: center; }
    .feature-pills { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }
    .pill { background: linear-gradient(135deg, #e11d48 0%, #f43f5e 100%); color: white; padding: 16px 32px; border-radius: 100px; font-size: 24px; font-weight: 600; box-shadow: 0 4px 16px rgba(225, 29, 72, 0.3); }

    .floating-elements { position: absolute; inset: 0; z-index: 5; pointer-events: none; }
    .float-item { position: absolute; font-size: 80px; animation: float-food 6s ease-in-out infinite; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.15)); }
    .item-1 { top: 8%; left: 10%; }
    .item-2 { top: 15%; right: 12%; animation-delay: -1s; }
    .item-3 { bottom: 25%; left: 8%; animation-delay: -2s; }
    .item-4 { bottom: 30%; right: 10%; animation-delay: -3s; }
    .item-5 { top: 40%; left: 5%; animation-delay: -4s; }
    @keyframes float-food { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-30px) rotate(10deg); } }

    .cta-section { position: absolute; bottom: 120px; z-index: 10; display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .cta-button { display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 24px 48px; border-radius: 100px; font-size: 28px; font-weight: 700; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }
    .cta-subtext { color: #64748b; font-size: 20px; font-weight: 500; }
    .bottom-wave { position: absolute; bottom: 0; left: 0; right: 0; height: 200px; }
    .bottom-wave svg { width: 100%; height: 100%; }

    /* Story 2 Dark Features */
    #story-graphic-2 { display: flex; flex-direction: column; padding: 80px; color: white; }
    .stacked-cards { position: relative; z-index: 10; display: flex; flex-direction: column; gap: 24px; margin-top: 100px; padding: 0 40px; }
    .stat-card { background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 32px 40px; display: flex; align-items: center; gap: 24px; }
    .stat-card.card-2 { transform: translateX(40px); }
    .stat-card.card-3 { transform: translateX(80px); }
    .stat-emoji { font-size: 48px; }
    .stat-number { font-size: 56px; font-weight: 800; background: linear-gradient(135deg, #e11d48 0%, #fb7185 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .stat-label { font-size: 24px; color: rgba(255, 255, 255, 0.7); margin-left: auto; }

    .headline-section { position: relative; z-index: 10; margin-top: 80px; padding: 0 60px; }
    .pre-headline { font-size: 24px; color: rgba(255, 255, 255, 0.6); text-transform: uppercase; letter-spacing: 4px; margin-bottom: 16px; }
    .mega-headline { display: flex; flex-direction: column; gap: 8px; }
    .mega-headline span { font-size: 80px; font-weight: 800; letter-spacing: -3px; line-height: 1; }
    .mega-headline .line-2 { font-size: 96px; }
    .sub-headline { font-size: 28px; color: rgba(255, 255, 255, 0.7); margin-top: 24px; }

    .phone-mockup { position: absolute; bottom: 200px; left: 50%; transform: translateX(-50%); z-index: 10; }
    .phone-frame { width: 320px; height: 640px; background: #1e293b; border-radius: 48px; padding: 12px; box-shadow: 0 50px 100px rgba(0, 0, 0, 0.5), 0 0 0 4px #0f172a, inset 0 0 0 1px rgba(255, 255, 255, 0.1); }
    .phone-screen { width: 100%; height: 100%; background: white; border-radius: 40px; overflow: hidden; padding: 20px; }
    .mock-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .mock-logo-icon { width: 32px; height: 40px; }
    .mock-logo-icon svg { width: 100%; height: 100%; }
    .mock-logo-text { font-size: 18px; font-weight: 800; background: linear-gradient(135deg, #e11d48 0%, #fb7185 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .mock-location { font-size: 12px; color: #64748b; }
    .mock-search { background: #f1f5f9; padding: 12px 16px; border-radius: 12px; color: #94a3b8; font-size: 14px; margin-bottom: 16px; }
    .mock-trucks { display: flex; gap: 12px; }
    .mock-truck-card { flex: 1; background: #f8fafc; border-radius: 12px; padding: 12px; }
    .mock-img { width: 100%; height: 80px; background: linear-gradient(135deg, #fce7f3 0%, #ffe4e6 100%); border-radius: 8px; margin-bottom: 8px; }
    .mock-truck-card span { font-size: 12px; font-weight: 600; color: #0f172a; }

    .brand-footer { position: absolute; bottom: 60px; left: 0; right: 0; text-align: center; z-index: 10; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .footer-logo-icon { width: 60px; height: 75px; }
    .footer-logo-icon svg { width: 100%; height: 100%; }
    .footer-logo { font-size: 48px; font-weight: 800; }
    .footer-tagline { font-size: 20px; color: rgba(255, 255, 255, 0.5); }

    /* Story 3 Testimonial */
    #story-graphic-3 { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px; }
    .quote-decoration { position: absolute; top: 120px; left: 80px; z-index: 5; }
    .big-quote { font-size: 400px; font-weight: 900; background: linear-gradient(135deg, #e11d48 0%, #fb7185 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; opacity: 0.15; line-height: 1; }
    .testimonial-content { position: relative; z-index: 10; text-align: center; max-width: 800px; }
    .testimonial-text { font-size: 48px; font-weight: 600; color: #0f172a; line-height: 1.4; margin-bottom: 60px; }
    .testimonial-author { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 32px; }
    .author-avatar { width: 80px; height: 80px; background: linear-gradient(135deg, #e11d48 0%, #fb7185 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 28px; font-weight: 700; }
    .author-info { text-align: left; }
    .author-name { font-size: 28px; font-weight: 700; color: #0f172a; display: block; }
    .author-role { font-size: 20px; color: #64748b; }
    .rating-stars { font-size: 40px; }
    .revenue-badge { position: absolute; bottom: 300px; right: 100px; padding: 24px 40px; display: flex; align-items: center; gap: 16px; z-index: 10; animation: pulse-badge 2s ease-in-out infinite; }
    @keyframes pulse-badge { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    .revenue-icon { font-size: 40px; }
    .revenue-text { font-size: 24px; color: #0f172a; }
    .revenue-text strong { color: #16a34a; font-weight: 800; }
    .story-brand-footer { position: absolute; bottom: 100px; text-align: center; z-index: 10; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .story-brand-footer .logo-small { width: 80px; height: 100px; }
    .story-brand-footer .logo-small svg { width: 100%; height: 100%; }
    .story-brand-footer .gradient-text { font-size: 56px; font-weight: 800; }
    .story-brand-footer .tagline { font-size: 24px; color: #64748b; }

    /* Square Graphic */
    #square-graphic-1 { display: flex; align-items: center; justify-content: center; padding: 80px; }
    .square-content { position: relative; z-index: 10; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 60px; }
    .logo-badge { display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); padding: 16px 32px; border-radius: 100px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); }
    .logo-badge .badge-icon { width: 56px; height: 70px; }
    .logo-badge .badge-icon svg { width: 100%; height: 100%; }
    .logo-badge span { font-size: 36px; font-weight: 800; }
    .square-headline { text-align: center; font-size: 72px; font-weight: 800; color: #0f172a; line-height: 1.2; }
    .square-headline span { display: block; }
    .strike-through { position: relative; color: #e11d48; }
    .strike-through::after { content: ''; position: absolute; left: -10px; right: -10px; top: 50%; height: 8px; background: #e11d48; transform: rotate(-3deg); }
    .comparison-visual { width: 100%; max-width: 700px; display: flex; flex-direction: column; gap: 32px; }
    .compare-item { display: flex; flex-direction: column; gap: 12px; }
    .compare-label { font-size: 24px; font-weight: 600; color: #64748b; }
    .compare-bar { height: 64px; background: #e2e8f0; border-radius: 16px; overflow: hidden; position: relative; }
    .bar-fill { height: 100%; display: flex; align-items: center; justify-content: flex-end; padding-right: 24px; }
    .bar-fill.bad { background: linear-gradient(90deg, #94a3b8 0%, #cbd5e1 100%); }
    .bar-fill.good { background: linear-gradient(90deg, #e11d48 0%, #fb7185 100%); }
    .bar-text { font-size: 24px; font-weight: 700; color: white; }
    .square-cta { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 28px 56px; border-radius: 100px; font-size: 28px; font-weight: 700; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); }
  </style>
</head>
<body>
  <!-- Story Graphic 1: Hero -->
  <div class="social-graphic story-graphic" id="story-graphic-1">
    <div class="mesh-gradient-bg">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
      <div class="gradient-orb orb-4"></div>
    </div>
    <div class="floating-elements">
      <span class="float-item item-1">🌮</span>
      <span class="float-item item-2">🍔</span>
      <span class="float-item item-3">🍕</span>
      <span class="float-item item-4">🌯</span>
      <span class="float-item item-5">🍜</span>
    </div>
    <div class="glass-card main-card">
      <div class="logo-section">
        <div class="logo-icon">
          ${logoSVG}
        </div>
        <h1 class="brand-name gradient-text">cravvr</h1>
      </div>
      <div class="tagline-section">
        <h2 class="main-tagline">Food Trucks</h2>
        <h2 class="main-tagline accent">Without The Fees</h2>
      </div>
      <div class="feature-pills">
        <span class="pill">0% Commission</span>
        <span class="pill">Real-time Tracking</span>
        <span class="pill">Direct Orders</span>
      </div>
    </div>
    <div class="cta-section">
      <div class="cta-button">
        <span>Download Now</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="cta-subtext">Available on iOS & Android</p>
    </div>
    <div class="bottom-wave">
      <svg viewBox="0 0 1080 200" preserveAspectRatio="none">
        <path d="M0,100 Q270,0 540,100 T1080,100 L1080,200 L0,200 Z" fill="rgba(225,29,72,0.1)"/>
        <path d="M0,120 Q270,20 540,120 T1080,120 L1080,200 L0,200 Z" fill="rgba(225,29,72,0.15)"/>
      </svg>
    </div>
  </div>

  <!-- Story Graphic 2: Features Dark -->
  <div class="social-graphic story-graphic" id="story-graphic-2" style="margin-top: 40px;">
    <div class="mesh-gradient-bg dark">
      <div class="gradient-orb orb-1 dark"></div>
      <div class="gradient-orb orb-2 dark"></div>
    </div>
    <div class="stacked-cards">
      <div class="stat-card card-1">
        <span class="stat-emoji">🚚</span>
        <span class="stat-number">500+</span>
        <span class="stat-label">Food Trucks</span>
      </div>
      <div class="stat-card card-2">
        <span class="stat-emoji">⭐</span>
        <span class="stat-number">4.9</span>
        <span class="stat-label">Avg Rating</span>
      </div>
      <div class="stat-card card-3">
        <span class="stat-emoji">💰</span>
        <span class="stat-number">0%</span>
        <span class="stat-label">Commission</span>
      </div>
    </div>
    <div class="headline-section">
      <p class="pre-headline">Introducing</p>
      <h1 class="mega-headline">
        <span class="line-1">Your</span>
        <span class="line-2 gradient-text">Favorite</span>
        <span class="line-3">Food Trucks</span>
      </h1>
      <p class="sub-headline">All in one place. No commissions.</p>
    </div>
    <div class="phone-mockup">
      <div class="phone-frame">
        <div class="phone-screen">
          <div class="mock-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="mock-logo-icon">
                ${logoSVG}
              </div>
              <span class="mock-logo-text">cravvr</span>
            </div>
            <span class="mock-location">📍 San Francisco</span>
          </div>
          <div class="mock-search">What are you craving?</div>
          <div class="mock-trucks">
            <div class="mock-truck-card">
              <div class="mock-img"></div>
              <span>Taco Loco</span>
            </div>
            <div class="mock-truck-card">
              <div class="mock-img"></div>
              <span>Burger Joint</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="brand-footer">
      <div class="footer-logo-icon">
        ${logoSVG}
      </div>
      <span class="footer-logo gradient-text">cravvr</span>
      <span class="footer-tagline">Food trucks without the fees</span>
    </div>
  </div>

  <!-- Story Graphic 3: Testimonial -->
  <div class="social-graphic story-graphic" id="story-graphic-3" style="margin-top: 40px;">
    <div class="mesh-gradient-bg warm">
      <div class="gradient-orb orb-1 warm"></div>
      <div class="gradient-orb orb-2 warm"></div>
    </div>
    <div class="quote-decoration">
      <span class="big-quote">"</span>
    </div>
    <div class="testimonial-content">
      <p class="testimonial-text">
        Finally an app that doesn't take 30% of my earnings. My regulars love the notifications!
      </p>
      <div class="testimonial-author">
        <div class="author-avatar">
          <span>MG</span>
        </div>
        <div class="author-info">
          <span class="author-name">Maria G.</span>
          <span class="author-role">Taco Truck Owner</span>
        </div>
      </div>
      <div class="rating-stars">
        <span>⭐⭐⭐⭐⭐</span>
      </div>
    </div>
    <div class="revenue-badge glass-card">
      <span class="revenue-icon">📈</span>
      <span class="revenue-text">Revenue up <strong>40%</strong></span>
    </div>
    <div class="story-brand-footer">
      <div class="logo-small">
        ${logoSVG}
      </div>
      <span class="gradient-text">cravvr</span>
      <span class="tagline">Real stories. Real results.</span>
    </div>
  </div>

  <!-- Square Graphic 1: Commission Comparison -->
  <div class="social-graphic square-graphic" id="square-graphic-1" style="margin-top: 40px;">
    <div class="mesh-gradient-bg">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
    </div>
    <div class="square-content">
      <div class="logo-badge">
        <div class="badge-icon">
          ${logoSVG}
        </div>
        <span class="gradient-text">cravvr</span>
      </div>
      <h1 class="square-headline">
        <span>Skip the</span>
        <span class="strike-through">30% fees</span>
      </h1>
      <div class="comparison-visual">
        <div class="compare-item bad">
          <span class="compare-label">Other Apps</span>
          <div class="compare-bar">
            <div class="bar-fill bad" style="width: 70%;">
              <span class="bar-text">You keep 70%</span>
            </div>
          </div>
        </div>
        <div class="compare-item good">
          <span class="compare-label gradient-text">cravvr</span>
          <div class="compare-bar">
            <div class="bar-fill good" style="width: 100%;">
              <span class="bar-text">You keep 100%</span>
            </div>
          </div>
        </div>
      </div>
      <div class="square-cta">
        <span>Join 500+ Food Trucks</span>
      </div>
    </div>
  </div>
</body>
</html>
`;

const graphics = [
  { id: 'story-graphic-1', name: 'cravvr-story-hero', width: 1080, height: 1920 },
  { id: 'story-graphic-2', name: 'cravvr-story-features', width: 1080, height: 1920 },
  { id: 'story-graphic-3', name: 'cravvr-story-testimonial', width: 1080, height: 1920 },
  { id: 'square-graphic-1', name: 'cravvr-square-commission', width: 1080, height: 1080 },
];

async function exportGraphics() {
  console.log('🚀 Starting Cravvr Social Media Export...\n');
  console.log('📐 Generating mobile-sized graphics (1080px width)');
  console.log('🎨 Using 2026 design trends: Mesh gradients, glassmorphism, bold typography');
  console.log('🍕 NEW: C-shaped pizza pin logo\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
  });

  // Write the HTML to a temp file
  const htmlPath = path.join(outputDir, 'temp-graphics.html');
  fs.writeFileSync(htmlPath, graphicsHTML);

  const page = await browser.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });

  // Wait for fonts to load
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 1000));

  // Export PNGs
  console.log('📸 Exporting PNG files...\n');

  for (const graphic of graphics) {
    console.log('   Capturing ' + graphic.name + '...');

    await page.setViewport({
      width: graphic.width,
      height: graphic.height,
      deviceScaleFactor: 1,
    });

    const element = await page.$('#' + graphic.id);
    if (element) {
      const pngPath = path.join(outputDir, graphic.name + '.png');
      await element.screenshot({
        path: pngPath,
        type: 'png',
      });
      console.log('   ✅ ' + graphic.name + '.png');
    }
  }

  // Export MP4 videos
  console.log('\n🎬 Generating MP4 videos with animations...\n');

  // Check if ffmpeg is available
  let ffmpegAvailable = false;
  try {
    execSync('which ffmpeg', { stdio: 'ignore' });
    ffmpegAvailable = true;
  } catch (e) {
    console.log('   ⚠️  ffmpeg not found. MP4 export will be skipped.');
    console.log('   💡 Install ffmpeg: brew install ffmpeg\n');
  }

  if (ffmpegAvailable) {
    for (const graphic of graphics) {
      console.log('   Recording ' + graphic.name + '...');

      await page.setViewport({
        width: graphic.width,
        height: graphic.height,
        deviceScaleFactor: 1,
      });

      // Reload to reset animations
      await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
      await page.evaluateHandle('document.fonts.ready');
      await new Promise(r => setTimeout(r, 500));

      const element = await page.$('#' + graphic.id);
      if (element) {
        const framesDir = path.join(outputDir, 'frames-' + graphic.name);
        if (fs.existsSync(framesDir)) {
          fs.rmSync(framesDir, { recursive: true });
        }
        fs.mkdirSync(framesDir, { recursive: true });

        const fps = 30;
        const duration = 3; // 3 seconds
        const frameCount = fps * duration;

        for (let i = 0; i < frameCount; i++) {
          const frameBuffer = await element.screenshot({ type: 'png' });
          fs.writeFileSync(path.join(framesDir, 'frame-' + String(i).padStart(4, '0') + '.png'), frameBuffer);
          await new Promise(r => setTimeout(r, 1000 / fps));
          process.stdout.write('\r   Recording: ' + Math.round((i + 1) / frameCount * 100) + '%');
        }
        console.log('');

        // Create MP4 with ffmpeg
        const mp4Path = path.join(outputDir, graphic.name + '.mp4');
        try {
          execSync('ffmpeg -y -framerate ' + fps + ' -i "' + framesDir + '/frame-%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 18 "' + mp4Path + '"', { stdio: 'ignore' });
          console.log('   ✅ ' + graphic.name + '.mp4');

          // Clean up frames
          fs.rmSync(framesDir, { recursive: true });
        } catch (e) {
          console.log('   ❌ Failed to create MP4 for ' + graphic.name);
        }
      }
    }
  }

  // Clean up temp HTML
  fs.unlinkSync(htmlPath);

  await browser.close();

  console.log('\n✨ Export complete!');
  console.log('📂 Files saved to: ' + outputDir + '\n');

  // List exported files
  const files = fs.readdirSync(outputDir);
  console.log('Exported files:');
  files.forEach(f => {
    const stats = fs.statSync(path.join(outputDir, f));
    const size = (stats.size / 1024).toFixed(1);
    console.log('   • ' + f + ' (' + size + ' KB)');
  });
}

exportGraphics().catch(console.error);
