import { chromium } from 'playwright';
const endpoint = process.env.ELECTRON_CDP || 'http://127.0.0.1:9999';
const browser = await chromium.connectOverCDP(endpoint);
const page = browser.contexts()[0]?.pages().find(item => item.url().includes('/out/renderer/index.html') || item.url().includes('renderer/index.html'));
if (!page) throw new Error('Renderer not found');
await page.waitForLoadState('domcontentloaded');
if (await page.getByText('Welcome to Synapse Browser', { exact: true }).count()) { await page.getByRole('button', { name: 'Skip Setup' }).click({ force: true }); await page.waitForTimeout(1400); }
await page.keyboard.press('Control+KeyK');
const dialog = page.getByRole('dialog', { name: 'Command palette' });
const commands = await dialog.getByRole('button').allTextContents();
const opened = await dialog.count();
await page.keyboard.press('Escape');
console.log(JSON.stringify({ opened, commands }, null, 2));
if (!opened || commands.length < 5) throw new Error('Command palette did not expose all expected commands');
await browser.close();
