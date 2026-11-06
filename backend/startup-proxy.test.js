const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createStartupProxy } = require('./startup-proxy');
const listen = server => new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
const close = server => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); });
const get = (port, method = 'GET') => new Promise((resolve, reject) => {
  const req = http.request({ hostname: '127.0.0.1', port, path: '/api/test', method }, res => {
    let body = ''; res.on('data', c => body += c); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
  }); req.on('error', reject); req.end();
});
test('concurrent requests share readiness probes; forwarding has timing', async () => {
  let checks = 0; let calls = 0;
  const app = http.createServer((req, res) => {
    if (req.url === '/api/health/ready') { checks++; res.writeHead(checks < 3 ? 503 : 200); }
    else calls++;
    res.end('ok');
  });
  const port = await listen(app); const proxy = createStartupProxy({ port, retryDelay: 5 }); const proxyPort = await listen(proxy);
  try {
    const results = await Promise.all(Array.from({ length: 8 }, () => get(proxyPort)));
    assert.equal(checks, 3); assert.equal(calls, 8);
    assert.ok(results.every(r => r.status === 200 && r.headers['server-timing'].includes('startup_wait')));
  } finally { await close(proxy); await close(app); }
});
test('a disconnected write is never replayed', async () => {
  let writes = 0;
  const app = http.createServer((req, res) => {
    if (req.url === '/api/health/ready') return res.end('ok');
    writes++; req.socket.destroy();
  });
  const port = await listen(app); const proxy = createStartupProxy({ port, retryDelay: 5 }); const proxyPort = await listen(proxy);
  try { const result = await get(proxyPort, 'POST'); assert.equal(result.status, 503); assert.equal(writes, 1); }
  finally { await close(proxy); await close(app); }
});
test('readiness timeout returns 503', async () => {
  const app = http.createServer((req, res) => { res.writeHead(503); res.end(); });
  const port = await listen(app); const proxy = createStartupProxy({ port, retryDelay: 5, startupTimeout: 40 }); const proxyPort = await listen(proxy);
  try { assert.equal((await get(proxyPort)).status, 503); }
  finally { await close(proxy); await close(app); }
});
