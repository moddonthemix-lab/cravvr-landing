import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const mdPath = resolve(root, 'docs/cravvr-2026-master-plan.md');
const htmlPath = resolve(root, 'docs/cravvr-2026-master-plan.html');
const pdfPath = resolve(root, 'docs/cravvr-2026-master-plan.pdf');

const body = execSync(`pandoc "${mdPath}" -f gfm -t html5 --syntax-highlighting=none`, { encoding: 'utf8' });

const css = `
  @page { size: Letter; margin: 0.75in 0.85in; }
  html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.5;
    color: #1a1a1a;
    max-width: none;
    margin: 0;
  }
  h1 {
    font-size: 26pt;
    color: #0f4f2e;
    border-bottom: 3px solid #b91c3c;
    padding-bottom: 8px;
    margin: 0 0 16px 0;
    page-break-after: avoid;
  }
  h2 {
    font-size: 17pt;
    color: #0f4f2e;
    margin-top: 28px;
    margin-bottom: 10px;
    border-bottom: 1px solid #d1d5db;
    padding-bottom: 4px;
    page-break-after: avoid;
  }
  h3 {
    font-size: 13pt;
    color: #b91c3c;
    margin-top: 18px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }
  p { margin: 6px 0 10px 0; }
  ul, ol { margin: 6px 0 12px 0; padding-left: 22px; }
  li { margin-bottom: 3px; }
  strong { color: #0f4f2e; }
  hr {
    border: 0;
    border-top: 1px solid #d1d5db;
    margin: 22px 0;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 10px 0 16px 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }
  th {
    background: #0f4f2e;
    color: white;
    text-align: left;
    padding: 7px 9px;
    font-weight: 600;
  }
  td {
    border: 1px solid #d1d5db;
    padding: 6px 9px;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #f7faf8; }
  code {
    font-family: "SF Mono", Menlo, Consolas, monospace;
    font-size: 9pt;
    background: #f1f5f3;
    padding: 1px 4px;
    border-radius: 3px;
    color: #0f4f2e;
  }
  pre {
    background: #f1f5f3;
    padding: 10px 12px;
    border-radius: 4px;
    border-left: 3px solid #0f4f2e;
    overflow-x: auto;
    page-break-inside: avoid;
  }
  pre code { background: none; padding: 0; }
  blockquote {
    border-left: 3px solid #b91c3c;
    background: #fef3f5;
    margin: 10px 0;
    padding: 8px 14px;
    color: #4b1822;
    page-break-inside: avoid;
  }
  a { color: #0f4f2e; text-decoration: none; }
  em { color: #4b5563; }
  h2, h3, table, pre, blockquote { page-break-inside: avoid; }
`;

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Cravvr 2026 Master Plan</title>
<style>${css}</style></head><body>${body}</body></html>`;

writeFileSync(htmlPath, html);

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});
try {
  const page = await browser.newPage();
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.75in', bottom: '0.75in', left: '0.85in', right: '0.85in' },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:8pt;color:#6b7280;width:100%;padding:0 0.85in;display:flex;justify-content:space-between;">
      <span style="color:#0f4f2e;font-weight:600;">Cravvr</span>
      <span>2026 Master Plan · Confidential</span>
    </div>`,
    footerTemplate: `<div style="font-size:8pt;color:#6b7280;width:100%;padding:0 0.85in;display:flex;justify-content:space-between;">
      <span>cravvr.com</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>`,
  });
} finally {
  await browser.close();
}

unlinkSync(htmlPath);
console.log(`PDF written: ${pdfPath}`);
