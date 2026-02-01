#!/usr/bin/env node
/**
 * Generate circular favicon from Cravrr logo
 * White background with colored logo
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../public/logo');

// Favicon sizes to generate
const SIZES = [
  { name: 'favicon-16.png', size: 16 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-48.png', size: 48 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
];

// HTML template - white circle background with colored logo
const createHTML = (size, logoBase64) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
    }
    .favicon-container {
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .favicon-logo {
      width: ${Math.round(size * 0.85)}px;
      height: ${Math.round(size * 0.85)}px;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="favicon-container">
    <img class="favicon-logo" src="data:image/png;base64,${logoBase64}" alt="">
  </div>
</body>
</html>
`;

async function generateFavicons() {
  console.log('🎨 Generating circular favicons...\n');

  // Read the source logo
  const logoPath = path.join(OUTPUT_DIR, 'cravrr-logo-transparent.png');
  if (!fs.existsSync(logoPath)) {
    console.error('❌ Logo not found at:', logoPath);
    process.exit(1);
  }

  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = logoBuffer.toString('base64');

  // Launch puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    for (const { name, size } of SIZES) {
      console.log(`  Generating ${name} (${size}x${size})...`);

      await page.setViewport({
        width: size,
        height: size,
        deviceScaleFactor: 1,
      });

      const html = createHTML(size, logoBase64);
      await page.setContent(html);

      // Wait a moment for rendering
      await new Promise(r => setTimeout(r, 100));

      const outputPath = path.join(OUTPUT_DIR, name);
      await page.screenshot({
        path: outputPath,
        type: 'png',
        omitBackground: true,
      });

      console.log(`  ✓ Saved: ${name}`);
    }

    console.log('\n✅ All favicons generated!\n');
    console.log('Update your index.html with:');
    console.log(`
  <link rel="icon" type="image/png" sizes="32x32" href="/logo/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/logo/favicon-16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/logo/apple-touch-icon.png" />
`);

  } finally {
    await browser.close();
  }
}

generateFavicons().catch(console.error);
