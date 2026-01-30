import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '..', 'social-exports');
const logoDir = path.join(__dirname, '..', 'public', 'logo');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Convert logos to base64
const fullLogoBase64 = fs.readFileSync(path.join(logoDir, 'IMG_3529.png')).toString('base64');
const iconLogoBase64 = fs.readFileSync(path.join(logoDir, 'IMG_0182.png')).toString('base64');

// High-quality Unsplash stock photos for food trucks
const stockPhotos = {
  foodTruck1: 'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=1200&q=90', // Food truck at night
  foodTruck2: 'https://images.unsplash.com/photo-1567129937968-cdad8f07e2f8?w=1200&q=90', // Taco truck
  tacos: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=1200&q=90', // Delicious tacos
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=90', // Gourmet burger
  streetFood: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=90', // Food spread
  happyCustomer: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=90', // Restaurant scene
  chef: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=1200&q=90', // Chef cooking
  mobileApp: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&q=90', // Phone in hand
};

// Professional 2026 design - Neil Patel inspired social graphics
const graphicsHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
      background: #000;
    }

    /* ===== STORY FORMAT (1080x1920) ===== */
    .story { width: 1080px; height: 1920px; position: relative; overflow: hidden; }

    /* ===== SQUARE FORMAT (1080x1080) ===== */
    .square { width: 1080px; height: 1080px; position: relative; overflow: hidden; }

    /* ===== SHARED COMPONENTS ===== */
    .logo-full { height: 80px; object-fit: contain; }
    .logo-icon { height: 100px; object-fit: contain; }

    .gradient-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.8) 100%);
    }

    .red-accent { color: #ea384c; }
    .bg-red { background: #ea384c; }

    /* ===== STORY 1: HERO - Food Truck Discovery ===== */
    #story-1 {
      background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
    }
    #story-1 .hero-image {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 55%;
      object-fit: cover;
    }
    #story-1 .gradient-overlay {
      background: linear-gradient(180deg,
        rgba(0,0,0,0.2) 0%,
        rgba(0,0,0,0) 20%,
        rgba(0,0,0,0) 40%,
        rgba(15,15,15,1) 55%
      );
    }
    #story-1 .content {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      padding: 60px;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }
    #story-1 .logo { height: 70px; margin-bottom: 20px; }
    #story-1 h1 {
      font-size: 72px;
      font-weight: 800;
      color: white;
      line-height: 1.1;
      letter-spacing: -2px;
    }
    #story-1 h1 span { color: #ea384c; }
    #story-1 .subtitle {
      font-size: 32px;
      color: rgba(255,255,255,0.7);
      font-weight: 500;
    }
    #story-1 .stats {
      display: flex;
      gap: 40px;
      margin-top: 20px;
    }
    #story-1 .stat {
      display: flex;
      flex-direction: column;
    }
    #story-1 .stat-value {
      font-size: 48px;
      font-weight: 800;
      color: #ea384c;
    }
    #story-1 .stat-label {
      font-size: 20px;
      color: rgba(255,255,255,0.6);
    }
    #story-1 .cta {
      background: #ea384c;
      color: white;
      padding: 24px 48px;
      border-radius: 16px;
      font-size: 28px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 12px;
      width: fit-content;
      margin-top: 20px;
    }
    #story-1 .cta svg { width: 28px; height: 28px; }

    /* ===== STORY 2: 0% Commission Message ===== */
    #story-2 {
      background: #ea384c;
    }
    #story-2 .pattern {
      position: absolute;
      inset: 0;
      opacity: 0.1;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
    #story-2 .content {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px;
      text-align: center;
    }
    #story-2 .logo { height: 100px; margin-bottom: 60px; }
    #story-2 .big-number {
      font-size: 280px;
      font-weight: 800;
      color: white;
      line-height: 0.9;
      text-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    #story-2 .percent { font-size: 180px; }
    #story-2 h2 {
      font-size: 64px;
      font-weight: 700;
      color: white;
      margin-top: 40px;
    }
    #story-2 .comparison {
      margin-top: 80px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      width: 100%;
    }
    #story-2 .compare-row {
      display: flex;
      align-items: center;
      gap: 24px;
      background: rgba(0,0,0,0.2);
      padding: 24px 32px;
      border-radius: 16px;
    }
    #story-2 .compare-label {
      font-size: 24px;
      color: rgba(255,255,255,0.8);
      width: 200px;
      text-align: left;
    }
    #story-2 .compare-bar {
      flex: 1;
      height: 40px;
      background: rgba(255,255,255,0.3);
      border-radius: 8px;
      overflow: hidden;
    }
    #story-2 .compare-fill {
      height: 100%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 16px;
      font-weight: 700;
      color: #ea384c;
    }
    #story-2 .compare-fill.others { width: 70%; }
    #story-2 .compare-fill.cravvr { width: 100%; background: #0f0f0f; color: white; }

    /* ===== STORY 3: Testimonial ===== */
    #story-3 {
      background: #fafafa;
    }
    #story-3 .food-image {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 45%;
      object-fit: cover;
    }
    #story-3 .content {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 60%;
      background: white;
      border-radius: 48px 48px 0 0;
      padding: 60px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 -20px 60px rgba(0,0,0,0.1);
    }
    #story-3 .quote-mark {
      font-size: 120px;
      color: #ea384c;
      line-height: 0.5;
      font-family: Georgia, serif;
      opacity: 0.3;
    }
    #story-3 .quote {
      font-size: 42px;
      font-weight: 600;
      color: #1a1a1a;
      line-height: 1.4;
      margin-top: 20px;
    }
    #story-3 .author {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-top: auto;
    }
    #story-3 .avatar {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #ea384c, #ff6b6b);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 32px;
      font-weight: 700;
    }
    #story-3 .author-info h4 {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a1a;
    }
    #story-3 .author-info p {
      font-size: 20px;
      color: #666;
    }
    #story-3 .stars {
      margin-top: 20px;
      font-size: 36px;
    }
    #story-3 .revenue-badge {
      position: absolute;
      top: 40%;
      right: 40px;
      background: #0f0f0f;
      color: white;
      padding: 20px 32px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 24px;
      font-weight: 600;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }
    #story-3 .revenue-badge span { color: #4ade80; font-weight: 800; }
    #story-3 .logo {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      height: 50px;
    }

    /* ===== SQUARE 1: Feature Highlight ===== */
    #square-1 {
      background: #0f0f0f;
      display: flex;
    }
    #square-1 .left {
      width: 50%;
      height: 100%;
      position: relative;
    }
    #square-1 .left img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    #square-1 .right {
      width: 50%;
      padding: 60px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    #square-1 .logo { height: 50px; margin-bottom: 40px; }
    #square-1 h2 {
      font-size: 52px;
      font-weight: 800;
      color: white;
      line-height: 1.15;
    }
    #square-1 h2 span { color: #ea384c; }
    #square-1 .features {
      margin-top: 40px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    #square-1 .feature {
      display: flex;
      align-items: center;
      gap: 16px;
      color: rgba(255,255,255,0.8);
      font-size: 22px;
    }
    #square-1 .feature-icon {
      width: 48px;
      height: 48px;
      background: #ea384c;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    /* ===== SQUARE 2: Stats/Social Proof ===== */
    #square-2 {
      background: linear-gradient(135deg, #ea384c 0%, #ff6b6b 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px;
      text-align: center;
    }
    #square-2 .logo { height: 70px; margin-bottom: 60px; }
    #square-2 h2 {
      font-size: 56px;
      font-weight: 800;
      color: white;
      margin-bottom: 60px;
    }
    #square-2 .stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 40px;
      width: 100%;
    }
    #square-2 .stat {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      padding: 40px;
      border-radius: 24px;
      border: 1px solid rgba(255,255,255,0.2);
    }
    #square-2 .stat-value {
      font-size: 64px;
      font-weight: 800;
      color: white;
    }
    #square-2 .stat-label {
      font-size: 22px;
      color: rgba(255,255,255,0.8);
      margin-top: 8px;
    }

    /* ===== SQUARE 3: Call to Action ===== */
    #square-3 {
      position: relative;
    }
    #square-3 .bg-image {
      position: absolute;
      inset: 0;
      object-fit: cover;
      width: 100%;
      height: 100%;
    }
    #square-3 .overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(234,56,76,0.9) 0%, rgba(15,15,15,0.95) 100%);
    }
    #square-3 .content {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px;
      text-align: center;
    }
    #square-3 .logo { height: 90px; margin-bottom: 50px; }
    #square-3 h2 {
      font-size: 64px;
      font-weight: 800;
      color: white;
      line-height: 1.15;
      margin-bottom: 30px;
    }
    #square-3 p {
      font-size: 28px;
      color: rgba(255,255,255,0.8);
      margin-bottom: 50px;
    }
    #square-3 .cta {
      background: white;
      color: #ea384c;
      padding: 28px 56px;
      border-radius: 16px;
      font-size: 28px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 12px;
    }
  </style>
</head>
<body>

  <!-- STORY 1: Hero Discovery -->
  <div class="story" id="story-1">
    <img class="hero-image" src="${stockPhotos.foodTruck1}" alt="Food truck">
    <div class="gradient-overlay"></div>
    <div class="content">
      <img class="logo" src="data:image/png;base64,${fullLogoBase64}" alt="Cravvr">
      <h1>Find Your<br><span>Favorite</span><br>Food Trucks</h1>
      <p class="subtitle">Discover, order, and track food trucks near you</p>
      <div class="stats">
        <div class="stat">
          <span class="stat-value">500+</span>
          <span class="stat-label">Food Trucks</span>
        </div>
        <div class="stat">
          <span class="stat-value">4.9</span>
          <span class="stat-label">App Rating</span>
        </div>
        <div class="stat">
          <span class="stat-value">0%</span>
          <span class="stat-label">Pickup Fees</span>
        </div>
      </div>
      <div class="cta">
        Download Free
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>
    </div>
  </div>

  <!-- STORY 2: 0% Commission -->
  <div class="story" id="story-2" style="margin-top: 40px;">
    <div class="pattern"></div>
    <div class="content">
      <img class="logo" src="data:image/png;base64,${iconLogoBase64}" alt="Cravvr">
      <div class="big-number">0<span class="percent">%</span></div>
      <h2>Commission on Pickup</h2>
      <div class="comparison">
        <div class="compare-row">
          <span class="compare-label">Other Apps</span>
          <div class="compare-bar">
            <div class="compare-fill others">Keep 70%</div>
          </div>
        </div>
        <div class="compare-row">
          <span class="compare-label">Cravvr</span>
          <div class="compare-bar">
            <div class="compare-fill cravvr">Keep 100%</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- STORY 3: Testimonial -->
  <div class="story" id="story-3" style="margin-top: 40px;">
    <img class="food-image" src="${stockPhotos.tacos}" alt="Delicious food">
    <div class="revenue-badge">
      Revenue up <span>+40%</span>
    </div>
    <div class="content">
      <span class="quote-mark">"</span>
      <p class="quote">Finally an app that doesn't take 30% of my hard-earned money. My regulars love getting notified when I'm nearby!</p>
      <div class="stars">⭐⭐⭐⭐⭐</div>
      <div class="author">
        <div class="avatar">MG</div>
        <div class="author-info">
          <h4>Maria Gonzalez</h4>
          <p>Owner, Taco Loco Food Truck</p>
        </div>
      </div>
    </div>
    <img class="logo" src="data:image/png;base64,${fullLogoBase64}" alt="Cravvr">
  </div>

  <!-- SQUARE 1: Features -->
  <div class="square" id="square-1" style="margin-top: 40px;">
    <div class="left">
      <img src="${stockPhotos.burger}" alt="Gourmet food">
    </div>
    <div class="right">
      <img class="logo" src="data:image/png;base64,${fullLogoBase64}" alt="Cravvr">
      <h2>Food Trucks.<br><span>Zero Fees.</span></h2>
      <div class="features">
        <div class="feature">
          <div class="feature-icon">📍</div>
          <span>Real-time location tracking</span>
        </div>
        <div class="feature">
          <div class="feature-icon">🔔</div>
          <span>Get notified when trucks are near</span>
        </div>
        <div class="feature">
          <div class="feature-icon">💳</div>
          <span>Easy mobile ordering</span>
        </div>
        <div class="feature">
          <div class="feature-icon">❤️</div>
          <span>Follow your favorites</span>
        </div>
      </div>
    </div>
  </div>

  <!-- SQUARE 2: Stats -->
  <div class="square" id="square-2" style="margin-top: 40px;">
    <img class="logo" src="data:image/png;base64,${iconLogoBase64}" alt="Cravvr">
    <h2>Join the Food Truck Revolution</h2>
    <div class="stats">
      <div class="stat">
        <div class="stat-value">500+</div>
        <div class="stat-label">Food Trucks</div>
      </div>
      <div class="stat">
        <div class="stat-value">50K+</div>
        <div class="stat-label">Happy Customers</div>
      </div>
      <div class="stat">
        <div class="stat-value">4.9★</div>
        <div class="stat-label">App Rating</div>
      </div>
      <div class="stat">
        <div class="stat-value">0%</div>
        <div class="stat-label">Pickup Fees</div>
      </div>
    </div>
  </div>

  <!-- SQUARE 3: CTA -->
  <div class="square" id="square-3" style="margin-top: 40px;">
    <img class="bg-image" src="${stockPhotos.streetFood}" alt="Street food">
    <div class="overlay"></div>
    <div class="content">
      <img class="logo" src="data:image/png;base64,${fullLogoBase64}" alt="Cravvr">
      <h2>Craving<br>Something Good?</h2>
      <p>Find the best food trucks near you</p>
      <div class="cta">
        Get the App
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>
    </div>
  </div>

</body>
</html>
`;

const graphics = [
  { id: 'story-1', name: 'cravvr-story-discover', width: 1080, height: 1920 },
  { id: 'story-2', name: 'cravvr-story-commission', width: 1080, height: 1920 },
  { id: 'story-3', name: 'cravvr-story-testimonial', width: 1080, height: 1920 },
  { id: 'square-1', name: 'cravvr-square-features', width: 1080, height: 1080 },
  { id: 'square-2', name: 'cravvr-square-stats', width: 1080, height: 1080 },
  { id: 'square-3', name: 'cravvr-square-cta', width: 1080, height: 1080 },
];

async function exportGraphics() {
  console.log('🚀 Cravvr Professional Social Media Export\n');
  console.log('📐 Formats: Story (1080x1920) & Square (1080x1080)');
  console.log('🎨 Style: 2026 Neil Patel-inspired design');
  console.log('📸 Using premium Unsplash photography\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
  });

  const htmlPath = path.join(outputDir, 'temp-pro-graphics.html');
  fs.writeFileSync(htmlPath, graphicsHTML);

  const page = await browser.newPage();

  // Enable request interception for external images
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    request.continue();
  });

  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0', timeout: 60000 });

  // Wait for fonts and images
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 3000)); // Extra time for images

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
    } else {
      console.log('   ❌ Element not found: ' + graphic.id);
    }
  }

  fs.unlinkSync(htmlPath);
  await browser.close();

  console.log('\n✨ Export complete!');
  console.log('📂 Files saved to: ' + outputDir + '\n');

  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.png'));
  console.log('Exported ' + files.length + ' PNG files:');
  files.forEach(f => {
    const stats = fs.statSync(path.join(outputDir, f));
    const size = (stats.size / 1024).toFixed(1);
    console.log('   • ' + f + ' (' + size + ' KB)');
  });
}

exportGraphics().catch(console.error);
