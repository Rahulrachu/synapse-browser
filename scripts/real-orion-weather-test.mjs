import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outputDir = process.env.SMOKE_OUTPUT || 'artifacts/real-orion';
await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.connectOverCDP(process.env.ELECTRON_CDP || 'http://127.0.0.1:9333');
const pages = browser.contexts()[0]?.pages() || [];
const renderer = pages.find(page => page.url().includes('/out/renderer/index.html') || page.url().includes('renderer/index.html')) || pages.find(page => page.url().startsWith('file://'));
if (!renderer) throw new Error(`Renderer page not found. Targets: ${pages.map(page => page.url()).join(', ')}`);
await renderer.waitForLoadState('domcontentloaded');
const onboarding = renderer.getByText('Welcome to Synapse Browser', { exact: true });
if (await onboarding.count()) {
  await renderer.screenshot({ path: `${outputDir}/01-onboarding.png`, fullPage: true });
  await renderer.getByRole('button', { name: 'Skip Setup' }).click({ force: true });
  await renderer.waitForTimeout(1500);
  await renderer.locator('button[aria-label="Open Settings"]').waitFor({ timeout: 15000 });
}
if (!(await renderer.getByRole('region', { name: 'ORION browser agent' }).count())) {
  await renderer.locator('button[aria-label="Toggle AI panel"]').click({ force: true });
}
const prompt = 'Search Google for the current weather in Bangalore and tell me the temperature. If Google shows a CAPTCHA or unusual-traffic page, navigate directly to https://wttr.in/Bangalore?format=3 and read the current temperature shown there.';
const input = renderer.getByRole('textbox', { name: 'What do you want me to do?' });
await input.fill(prompt);
await renderer.screenshot({ path: `${outputDir}/02-prompt.png`, fullPage: true });
await renderer.locator('button[aria-label="Run ORION"]').click({ force: true });
await renderer.screenshot({ path: `${outputDir}/03-running.png`, fullPage: true });
const browserPage = pages.find(page => page !== renderer && page.url().startsWith('http'));
let observedUrls = browserPage ? [browserPage.url()] : [];
let finished = false;
for (let i = 0; i < 120; i += 1) {
  const confirm = renderer.getByRole('button', { name: 'Confirm', exact: true });
  if (await confirm.count() && await confirm.first().isVisible().catch(() => false)) await confirm.first().click({ force: true });
  await renderer.waitForTimeout(1000);
  if (browserPage && !observedUrls.includes(browserPage.url())) observedUrls.push(browserPage.url());
  const stop = renderer.getByRole('button', { name: 'Stop ORION' });
  if (!(await stop.count())) { finished = true; break; }
}
await renderer.screenshot({ path: `${outputDir}/04-final.png`, fullPage: true });
const text = await renderer.locator('body').innerText();
const details = text.includes('Finished') || text.includes('Preparing the result');
const browserInteracted = observedUrls.some(url => /google\.com\/search|weather|wttr\.in|bing\.com\/search/i.test(url));
console.log(JSON.stringify({ prompt, finished, browserInteracted, observedUrls, responseSurface: details, bodyTail: text.slice(-1600) }, null, 2));
if (!finished) throw new Error('ORION did not leave the running state within 120 seconds');
if (!browserInteracted) throw new Error(`ORION did not visibly navigate the browser. Observed URLs: ${observedUrls.join(', ')}`);
await browser.close();
