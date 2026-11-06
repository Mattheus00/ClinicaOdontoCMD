import { chromium, expect } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const origin = 'http://127.0.0.1:5174';
const fixture = JSON.parse(await readFile(new URL('../../tmp/perf-ui.json', import.meta.url)));
const output = new URL('../../output/performance/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const result = [];
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const requests = [], errors = [];
    page.on('request', req => { if (req.url().includes('/api/')) requests.push(new URL(req.url()).pathname); });
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(origin + '/login');
    await page.locator('input[type=email]').fill(fixture.email);
    await page.locator('input[type=password]').fill(fixture.password);
    await page.getByRole('button', { name: 'Entrar', exact: false }).click();
    await expect(page).toHaveURL(/\/agenda$/);
    const tour = page.getByRole('button', { name: 'Fechar tutorial' });
    await tour.waitFor({ state: 'visible', timeout: 6000 }).catch(() => {});
    if (await tour.isVisible()) await tour.click();
    await expect(page.getByRole('heading', { name: 'Agenda', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Pacientes', exact: true }).filter({ visible: true }).click();
    await expect(page.getByText('Paciente sintético 000', { exact: true }).first()).toBeVisible();
    const patientReads = requests.filter(p => p === '/api/patients').length;
    await page.getByRole('link', { name: viewport.width < 800 ? 'Finanças' : 'Financeiro', exact: true }).filter({ visible: true }).click();
    await expect(page.getByRole('heading', { name: 'Financeiro', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Pacientes', exact: true }).filter({ visible: true }).click();
    await expect(page.getByText('Paciente sintético 000', { exact: true }).first()).toBeVisible();
    expect(requests.filter(p => p === '/api/patients').length).toBe(patientReads);
    await page.getByRole('link', { name: 'Estoque', exact: true }).filter({ visible: true }).click();
    await expect(page.getByText('Página 1 de 3 · 55 registros')).toBeVisible();
    await page.getByRole('button', { name: 'Próxima', exact: true }).click();
    await expect(page.getByText('Página 2 de 3 · 55 registros')).toBeVisible();
    await page.screenshot({ path: new URL(`stock-${viewport.width}.png`, output).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
    await page.goto(origin + `/patients/${fixture.patientId}`);
    await expect(page.getByLabel('Nome completo')).toBeVisible();
    await page.getByLabel('Nome completo').fill('Rascunho preservado');
    // An actual focus-triggered refresh must retain the unsaved form.
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.getByLabel('Nome completo')).toHaveValue('Rascunho preservado');
    await page.getByRole('tab', { name: 'Financeiro', exact: true }).click();
    await expect(page.getByText('Página 1 de 2 · 25 registros')).toBeVisible();
    await page.getByRole('tab', { name: 'Odontograma', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Alternar modelo 3D', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Alternar modelo 3D', exact: true }).click();
    await expect(page.locator('.odg-3d-badge')).toHaveCount(32, { timeout: 30000 });
    await page.locator('.odg-3d-badge[data-tooth="11"]').click();
    await expect(page.locator('.odg-3d-badge[data-tooth="11"]')).toHaveAttribute('aria-pressed', 'true');
    await page.screenshot({ path: new URL(`odontogram-${viewport.width}.png`, output).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
    result.push({ viewport, requests: requests.length, javascriptErrors: errors, metrics: await page.evaluate(() => window.__denticPerformance?.() ?? []) });
    expect(errors).toEqual([]);
    await context.close();
  }
  await writeFile(new URL('browser.json', output), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally { await browser.close(); }
