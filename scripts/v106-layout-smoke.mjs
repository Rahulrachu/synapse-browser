import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const endpoint = process.env.ELECTRON_CDP || 'http://127.0.0.1:9888';
const output = process.env.SMOKE_OUTPUT || 'artifacts/v106-layout';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.connectOverCDP(endpoint);
const pages = browser.contexts()[0]?.pages() || [];
const page = pages.find(item => item.url().includes('/out/renderer/index.html') || item.url().includes('renderer/index.html')) || pages.find(item => item.url().startsWith('file://'));
if (!page) throw new Error('Renderer not found');
await page.waitForLoadState('domcontentloaded');
const skip = page.getByRole('button', { name: 'Skip Setup' });
if (await skip.count()) { await skip.click({ force: true }); await page.waitForTimeout(800); }
const setupBack = page.getByRole('button', { name: 'Back' });
if (await page.getByText('Let’s connect your AI', { exact: true }).count() && await setupBack.count()) { await setupBack.click({ force: true }); await page.waitForTimeout(200); await page.getByRole('button', { name: 'Skip Setup' }).click({ force: true }); await page.waitForTimeout(800); }
const staleSettings = page.getByRole('dialog', { name: 'Settings' });
if (await staleSettings.count()) { const closeSettings = page.getByRole('button', { name: 'Close Settings' }); if (await closeSettings.count()) await closeSettings.click({ force: true }); await page.waitForTimeout(250); }
if (await page.getByRole('button', { name: 'Toggle AI panel' }).count() !== 1) throw new Error('AI toggle missing');
if (await page.locator('aside[aria-label="AI workspace"]').count() === 1) { await page.getByRole('button', { name: 'Toggle AI panel' }).click(); await page.waitForTimeout(350); }
if (await page.locator('aside[aria-label="AI workspace"]').count() !== 0) throw new Error('Could not normalize ORION closed state');
await page.screenshot({ path: `${output}/01-browser-before-orion.png`, fullPage: true });
await page.getByRole('button', { name: 'Toggle AI panel' }).click();
await page.waitForTimeout(350);
if (await page.locator('aside[aria-label="AI workspace"]').count() !== 1) throw new Error('ORION shell did not open');
if (await page.locator('main > div.synapse-browser-stage').count() !== 1) throw new Error('Browser stage missing while ORION open');
await page.screenshot({ path: `${output}/02-browser-with-orion.png`, fullPage: true });
await page.getByRole('button', { name: 'Toggle AI panel' }).click();
await page.waitForTimeout(350);
if (await page.locator('aside[aria-label="AI workspace"]').count() !== 0) throw new Error('ORION shell did not close');
await page.screenshot({ path: `${output}/03-browser-after-orion.png`, fullPage: true });
await page.getByRole('button', { name: 'Open Settings' }).click();
await page.waitForTimeout(250);
const provider = page.getByRole('combobox', { name: 'AI provider' });
if (await provider.count() !== 1) throw new Error('Custom provider combobox missing');
await provider.click();
if (await page.locator('.synapse-provider-menu').count() !== 1) throw new Error('Dark provider popover missing');
await page.screenshot({ path: `${output}/04-provider-popover.png`, fullPage: true });
await provider.press('ArrowDown');
if ((await provider.getAttribute('aria-expanded')) !== 'false') throw new Error('Provider popover did not close after keyboard selection');
console.log(JSON.stringify({ browserBeforeOrion: true, browserWithOrion: true, browserAfterOrion: true, providerPopover: true, keyboardProviderSelection: true }, null, 2));
await browser.close();
