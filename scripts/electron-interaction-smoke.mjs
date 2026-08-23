import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outputDir = process.env.SMOKE_OUTPUT || 'artifacts/smoke';
await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.connectOverCDP(process.env.ELECTRON_CDP || 'http://127.0.0.1:9222');
const contexts = browser.contexts();
if (!contexts.length) throw new Error('Electron exposed no browser context');
const pages = contexts[0].pages();
if (!pages.length) throw new Error('Electron exposed no renderer page');
const page = pages[0];
await page.waitForLoadState('domcontentloaded');
await page.screenshot({ path: `${outputDir}/main.png`, fullPage: true });

const settingsButton = page.getByRole('button', { name: 'Open Settings' });
await settingsButton.click();
await page.getByRole('dialog', { name: 'Settings' }).waitFor();
await page.screenshot({ path: `${outputDir}/settings.png`, fullPage: true });
const reduceMotion = page.getByRole('checkbox', { name: 'Reduce motion' });
await reduceMotion.check();
if (!(await reduceMotion.isChecked())) throw new Error('Settings checkbox did not respond');
await page.getByRole('button', { name: 'Close Settings' }).click();
await page.getByRole('dialog', { name: 'Settings' }).waitFor({ state: 'hidden' });

const aiInput = page.getByRole('textbox', { name: 'What do you want me to do?' });
await aiInput.fill('Hello, test the Synapse Browser AI panel.');
if ((await aiInput.inputValue()) !== 'Hello, test the Synapse Browser AI panel.') throw new Error('AI input did not retain text');
await page.getByRole('button', { name: 'Run ORION' }).click();
await page.screenshot({ path: `${outputDir}/ai-running.png`, fullPage: true });
await page.waitForTimeout(1500);
const aiState = await page.getByRole('button', { name: /Run ORION|Stop ORION/ }).getAttribute('aria-label');
await page.screenshot({ path: `${outputDir}/ai-result.png`, fullPage: true });
console.log(JSON.stringify({ pageUrl: page.url(), title: await page.title(), settings: 'PASS', aiInput: 'PASS', aiRunButton: 'PASS', aiButtonStateAfterRun: aiState }, null, 2));
await browser.close();
