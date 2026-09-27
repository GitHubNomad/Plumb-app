// Renders the PWA icons from the favicon's shapes with Playwright's Chromium.
// Run after changing the mark: `node scripts/make-icons.mjs`. Output is committed.
import { chromium } from "@playwright/test";

const PINE = "#1F3329";
const COPPER = "#C2542A";

// The bob from public/favicon.svg, on a 32-unit grid.
const bob = `
  <rect x="14.5" y="4" width="3" height="16" rx="1.5" fill="${COPPER}"/>
  <circle cx="16" cy="23.5" r="5" fill="${COPPER}"/>`;

// "any": the favicon as drawn, rounded corners included.
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="${PINE}"/>${bob}</svg>`;

// Maskable and Apple: full-bleed square, bob scaled into the central 60% so Android's
// circle/squircle masks and iOS's corner rounding never clip it.
const bleed = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="${PINE}"/>
  <g transform="translate(16 16) scale(0.62) translate(-16 -15)">${bob}</g></svg>`;

const outputs = [
  ["public/icons/icon-192.png", rounded, 192],
  ["public/icons/icon-512.png", rounded, 512],
  ["public/icons/icon-maskable-512.png", bleed, 512],
  ["public/icons/apple-touch-icon.png", bleed, 180],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [path, svg, size] of outputs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  );
  await page.locator("svg").screenshot({ path, omitBackground: true });
  console.log(`${path} ${size}x${size}`);
}
await browser.close();
