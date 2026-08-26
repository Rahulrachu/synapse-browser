import { chromium } from 'playwright';
import fs from 'node:fs';

const endpoint = process.env.ELECTRON_CDP || 'http://127.0.0.1:9333';
const outputDir = process.env.SMOKE_OUTPUT || 'artifacts/real-orion-wikipedia';
fs.mkdirSync(outputDir, { recursive: true });
const browser = await chromium.connectOverCDP(endpoint);
const pages = browser.contexts()[0]?.pages() || [];
const renderer = pages.find(page => page.url().includes('/out/renderer/index.html') || page.url().includes('renderer/index.html')) || pages.find(page => page.url().startsWith('file://'));
if (!renderer) throw new Error(`Renderer page not found. Targets: ${pages.map(page => page.url()).join(', ')}`);
await renderer.waitForLoadState('domcontentloaded');
const onboarding = renderer.getByText('Welcome to Synapse Browser', { exact: true });
if (await onboarding.count()) {
  await renderer.screenshot({ path: `${outputDir}/01-onboarding.png`, fullPage: true });
  await renderer.getByRole('button', { name: 'Skip Setup' }).click({ force: true });
  await renderer.waitForTimeout(1500);
}
if (!(await renderer.getByRole('region', { name: 'ORION browser agent' }).count())) {
  await renderer.locator('button[aria-label="Toggle AI panel"]').click({ force: true });
}
const prompt = 'Open Wikipedia and search for Bangalore. Read the visible page and tell me the article title and one fact about Bangalore.';
const input = renderer.getByRole('textbox', { name: 'What do you want me to do?' });
await input.fill(prompt);
await renderer.screenshot({ path: `${outputDir}/02-prompt.png`, fullPage: true });
await renderer.locator('button[aria-label="Run ORION"]').click({ force: true });
await renderer.screenshot({ path: `${outputDir}/03-running.png`, fullPage: true });
let finished = false;
for (let i = 0; i < 120; i++) {
  const confirm = renderer.getByRole('button', { name: 'Confirm', exact: true });
  if (await confirm.count() && await confirm.first().isVisible().catch(() => false)) await confirm.first().click({ force: true });
  await renderer.waitForTimeout(1000);
  const body = await renderer.locator('body').innerText();
  if (body.includes('Finished') || body.includes('Agent run completed with verified evidence') || body.includes('ORION RESPONSE')) { finished = body.includes('Finished') || body.includes('Agent run completed with verified evidence'); if (finished) break; }
}
await renderer.screenshot({ path: `${outputDir}/04-final.png`, fullPage: true });
const urls = await Promise.all((browser.contexts()[0]?.pages() || []).map(page => page.url()));
const text = await renderer.locator('body').innerText();
const wikipediaInteracted = urls.some(url => /wikipedia\.org\/wiki\/|wikipedia\.org\/w\/index\.php/i.test(url));
const responseSurface = text.includes('ORION RESPONSE') && (text.includes('Finished') || text.includes('Preparing the result'));
console.log(JSON.stringify({ prompt, finished, wikipediaInteracted, urls, responseSurface, bodyTail: text.slice(-1800) }, null, 2));
if (!finished) throw new Error('ORION did not finish the Wikipedia task within 120 seconds');
if (!wikipediaInteracted) throw new Error(`ORION did not visibly navigate to Wikipedia. Observed URLs: ${urls.join(', ')}`);
if (!responseSurface) throw new Error('ORION response surface was not rendered');
await browser.close();
