import { writeFile, mkdir } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

const base = process.env.PERF_API ?? 'http://127.0.0.1:8181/api';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Synthetic writes/load are restricted to localhost.');
let token;
async function call(path, method = 'GET', body) {
  const start = performance.now();
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${path.split('?')[0]}: HTTP ${response.status}`);
  return { data: text ? JSON.parse(text) : null, ms: performance.now() - start, bytes: Buffer.byteLength(text), timing: response.headers.get('server-timing') };
}
const email = `performance-${Date.now()}@example.invalid`;
const password = 'Performance-Test-2026!';
await call('/auth/register', 'POST', { clinicName: 'Teste de desempenho — dados sintéticos', email, phone: '11999990000', password });
token = (await call('/auth/login', 'POST', { email, password, rememberMe: false })).data.accessToken;
let patientId;
for (let i = 0; i < 55; i++) {
  const patient = await call('/patients', 'POST', { name: `Paciente sintético ${String(i).padStart(3, '0')}`, phone: '11999990000' });
  patientId ??= patient.data.id;
  await call('/stock/items', 'POST', { name: `Material sintético ${String(i).padStart(3, '0')}`, category: 'DENTAL', unit: 'un', quantity: 10, minimumQuantity: 5 });
}
for (let i = 0; i < 25; i++) await call(`/patients/${patientId}/billing/payments`, 'POST', { amount: 12.50, method: 'PIX', status: 'PAID' });
await call('/user/preferences', 'PATCH', { tutorialVersion: 2 }).catch(() => undefined);
const routes = ['/patients?page=0&size=20', '/stock/items?page=0&size=20', '/financial/dashboard', `/patients/${patientId}/summary`, '/staff-notifications'];
const results = [];
for (const concurrency of [5, 10, 20]) {
  const samples = [];
  const start = performance.now();
  await Promise.all(Array.from({ length: concurrency }, async () => {
    for (const route of routes) samples.push(await call(route));
  }));
  const sorted = samples.map(s => s.ms).sort((a,b) => a-b);
  results.push({ concurrentSessions: concurrency, requests: samples.length, errors: 0,
    durationMs: Math.round(performance.now()-start), p50Ms: Math.round(sorted[Math.floor(sorted.length*.5)]),
    p95Ms: Math.round(sorted[Math.ceil(sorted.length*.95)-1]), transferredBytes: samples.reduce((sum,s) => sum+s.bytes,0) });
}
await mkdir('output/performance', { recursive: true });
await writeFile('output/performance/local-load.json', JSON.stringify({ environment: 'Local H2, synthetic data; not comparable to production p95', at: new Date().toISOString(), results }, null, 2));
await writeFile('tmp/perf-ui.json', JSON.stringify({ email, password, patientId }));
console.log(JSON.stringify({ results, fixture: 'tmp/perf-ui.json' }));
