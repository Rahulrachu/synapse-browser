import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const endpoint = process.env.ELECTRON_CDP || 'http://127.0.0.1:9888';
const output = process.env.SMOKE_OUTPUT || 'artifacts/whole-product-visual';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.connectOverCDP(endpoint);
const pages = browser.contexts()[0]?.pages() || [];
const page = pages.find(item => item.url().includes('/out/renderer/index.html') || item.url().includes('renderer/index.html')) || pages.find(item => item.url().startsWith('file://'));
if (!page) throw new Error('Renderer not found');
await page.waitForLoadState('domcontentloaded');
const onboarding = page.getByText('Welcome to Synapse Browser', { exact: true });
if (await onboarding.count()) { await page.getByRole('button', { name: 'Skip Setup' }).click({ force: true }); await page.waitForTimeout(1600); } else if (await page.getByText('Let’s connect your AI', { exact: true }).count()) { await page.getByRole('button', { name: 'Back' }).click({ force: true }); await page.waitForTimeout(250); await page.getByRole('button', { name: 'Skip Setup' }).click({ force: true }); await page.waitForTimeout(1600); }
await page.screenshot({ path: `${output}/01-browser-shell.png`, fullPage: true });
await page.getByRole('button', { name: 'Toggle AI panel' }).click(); await page.waitForTimeout(250); await page.screenshot({ path: `${output}/02-orion.png`, fullPage: true });
await page.getByRole('button', { name: 'Files' }).click(); await page.waitForTimeout(250); await page.screenshot({ path: `${output}/03-files.png`, fullPage: true });
await page.getByRole('button', { name: 'Terminal' }).click(); await page.waitForTimeout(250); await page.screenshot({ path: `${output}/04-terminal.png`, fullPage: true });
await page.getByRole('button', { name: 'Open Settings' }).click(); await page.waitForTimeout(250); await page.screenshot({ path: `${output}/05-settings.png`, fullPage: true });
console.log(JSON.stringify({ title: await page.title(), browser: await page.getByRole('button', { name: 'Toggle AI panel' }).count(), orion: await page.getByRole('region', { name: 'ORION browser agent' }).count(), files: await page.getByRole('region', { name: 'Files workspace' }).count(), terminal: await page.getByRole('region', { name: 'Terminal workspace' }).count(), settings: await page.getByRole('dialog', { name: 'Settings' }).count() }, null, 2));
await browser.close();
