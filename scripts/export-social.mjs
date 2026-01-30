import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '..', 'social-exports');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const graphics = [
  { id: 'story-graphic-1', name: 'cravvr-story-hero', width: 1080, height: 1920 },
  { id: 'story-graphic-2', name: 'cravvr-story-features', width: 1080, height: 1920 },
  { id: 'story-graphic-3', name: 'cravvr-story-testimonial', width: 1080, height: 1920 },
  { id: 'square-graphic-1', name: 'cravvr-square-commission', width: 1080, height: 1080 },
];

async function exportGraphics() {
  console.log('🚀 Starting Cravvr Social Media Export...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Wait for dev server to be ready (assumes running on port 5173)
  const devUrl = 'http://localhost:5173/social';

  console.log('📡 Connecting to dev server...');

  try {
    await page.goto(devUrl, { waitUntil: 'networkidle0', timeout: 30000 });
  } catch (error) {
    console.error('❌ Could not connect to dev server at', devUrl);
    console.log('💡 Make sure to run "npm run dev" first in another terminal');
    await browser.close();
    process.exit(1);
  }

  console.log('✅ Connected to dev server\n');

  // Export each graphic
  for (const graphic of graphics) {
    console.log(`📸 Exporting ${graphic.name}...`);

    // Set viewport to match graphic size
    await page.setViewport({
      width: graphic.width,
      height: graphic.height,
      deviceScaleFactor: 1,
    });

    // Create a dedicated page for this graphic
    const graphicPage = await browser.newPage();
    await graphicPage.setViewport({
      width: graphic.width,
      height: graphic.height,
      deviceScaleFactor: 1,
    });

    // Create HTML that renders just this graphic
    const graphicHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; }
          </style>
        </head>
        <body>
          <div id="graphic"></div>
        </body>
      </html>
    `;

    // For PNG export, we'll screenshot the element directly from the main page
    await page.goto(devUrl, { waitUntil: 'networkidle0' });

    // Click the appropriate nav button to show the graphic
    const navButtons = await page.$$('.nav-btn');
    const graphicIndex = graphics.findIndex(g => g.id === graphic.id);
    if (navButtons[graphicIndex]) {
      await navButtons[graphicIndex].click();
      await page.waitForTimeout(500); // Wait for render
    }

    // Find and screenshot the graphic element
    const element = await page.$(`#${graphic.id}`);
    if (element) {
      const pngPath = path.join(outputDir, `${graphic.name}.png`);
      await element.screenshot({
        path: pngPath,
        type: 'png',
      });
      console.log(`   ✅ PNG saved: ${pngPath}`);
    }

    await graphicPage.close();
  }

  // Export MP4 videos with animation
  console.log('\n🎬 Exporting MP4 videos...\n');

  for (const graphic of graphics) {
    console.log(`🎥 Recording ${graphic.name}...`);

    const mp4Path = path.join(outputDir, `${graphic.name}.mp4`);

    // Set viewport
    await page.setViewport({
      width: graphic.width,
      height: graphic.height,
      deviceScaleFactor: 1,
    });

    // Navigate and select graphic
    await page.goto(devUrl, { waitUntil: 'networkidle0' });
    const navButtons = await page.$$('.nav-btn');
    const graphicIndex = graphics.findIndex(g => g.id === graphic.id);
    if (navButtons[graphicIndex]) {
      await navButtons[graphicIndex].click();
      await page.waitForTimeout(500);
    }

    // Capture frames for video
    const frames = [];
    const duration = 3000; // 3 seconds
    const fps = 30;
    const frameCount = Math.floor(duration / 1000 * fps);

    const element = await page.$(`#${graphic.id}`);
    if (element) {
      for (let i = 0; i < frameCount; i++) {
        const frameBuffer = await element.screenshot({ type: 'png' });
        frames.push(frameBuffer);
        await page.waitForTimeout(1000 / fps);
        process.stdout.write(`\r   Recording frame ${i + 1}/${frameCount}`);
      }
      console.log('');

      // Save frames and use ffmpeg to create video
      const framesDir = path.join(outputDir, `frames-${graphic.name}`);
      if (!fs.existsSync(framesDir)) {
        fs.mkdirSync(framesDir, { recursive: true });
      }

      for (let i = 0; i < frames.length; i++) {
        fs.writeFileSync(path.join(framesDir, `frame-${String(i).padStart(4, '0')}.png`), frames[i]);
      }

      console.log(`   📁 Frames saved to: ${framesDir}`);
      console.log(`   💡 To create MP4, run: ffmpeg -framerate ${fps} -i "${framesDir}/frame-%04d.png" -c:v libx264 -pix_fmt yuv420p "${mp4Path}"`);
    }
  }

  await browser.close();

  console.log('\n✨ Export complete!');
  console.log(`📂 Files saved to: ${outputDir}\n`);
}

exportGraphics().catch(console.error);
