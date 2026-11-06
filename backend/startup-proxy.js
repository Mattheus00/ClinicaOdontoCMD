const http = require('node:http');
const { spawn } = require('node:child_process');

function createStartupProxy({ host = '127.0.0.1', port = 8080, startupTimeout = 60000, retryDelay = 250 } = {}) {
  let ready = false;
  let probing = false;
  let probe;
  let timer;
  const waiters = new Set();
  const agent = new http.Agent({ keepAlive: true, maxSockets: 64 });

  function scheduleProbe() {
    if (probing || !waiters.size) return;
    probing = true;
    probe = http.get({ host, port, path: '/api/health/ready', agent, timeout: 1500 }, res => {
      ready = res.statusCode === 200;
      res.resume();
      res.once('end', finish);
      res.once('error', () => { ready = false; finish(); });
    });
    probe.on('timeout', () => probe.destroy());
    probe.on('error', finish);
    function finish() {
      if (!probing) return;
      probing = false;
      if (ready) {
        for (const notify of [...waiters]) notify();
      } else if (waiters.size) {
        timer = setTimeout(scheduleProbe, retryDelay);
      }
    }
  }

  const server = http.createServer((request, response) => {
    const startedAt = Date.now();
    let upstream;
    let deadline;
    let bytes = 0;
    const chunks = [];
    const cleanup = () => {
      clearTimeout(deadline);
      waiters.delete(forward);
      if (!waiters.size) { clearTimeout(timer); if (probing) { probing = false; probe?.destroy(); } }
    };
    const fail = (code, message) => {
      cleanup();
      if (response.destroyed || response.writableEnded) return;
      if (!response.headersSent) response.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      response.end(JSON.stringify({ message }));
    };
    response.on('close', () => { cleanup(); upstream?.destroy(); });
    request.on('aborted', () => { cleanup(); upstream?.destroy(); });
    request.on('error', () => { cleanup(); upstream?.destroy(); });

    function forward() {
      cleanup();
      if (response.destroyed || response.writableEnded) return;
      const startupMs = Date.now() - startedAt;
      upstream = http.request({ host, port, path: request.url, method: request.method, headers: request.headers, agent }, res => {
        const timing = res.headers['server-timing'];
        res.headers['server-timing'] = `${timing ? timing + ', ' : ''}startup_wait;dur=${startupMs}`;
        response.writeHead(res.statusCode || 502, res.headers);
        res.pipe(response);
        res.on('error', () => response.destroy());
      });
      upstream.on('error', () => {
        ready = false;
        // Never replay: a disconnected write may already have committed.
        if (response.headersSent) response.destroy();
        else fail(503, 'API temporariamente indisponível. Tente novamente.');
      });
      upstream.end(Buffer.concat(chunks));
    }
    request.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > 10 * 1024 * 1024) { fail(413, 'Requisição muito grande.'); request.resume(); return; }
      if (!response.writableEnded) chunks.push(chunk);
    });
    request.on('end', () => {
      if (response.destroyed || response.writableEnded) return;
      if (ready) return forward();
      waiters.add(forward);
      deadline = setTimeout(() => fail(503, 'O serviço está iniciando. Tente novamente.'), startupTimeout);
      scheduleProbe();
    });
  });
  server.on('close', () => { clearTimeout(timer); probe?.destroy(); agent.destroy(); });
  return server;
}

if (require.main === module) {
  const javaArgs = process.env.DENTIC_DISABLE_CDS === 'true' ? [] : ['-Xshare:auto', '-XX:SharedArchiveFile=/app/application.jsa'];
  const java = spawn('/opt/java/openjdk/bin/java', [...javaArgs, '-Dserver.port=8080', '-jar', '/app/app.jar'], { stdio: 'inherit' });
  const server = createStartupProxy().listen(Number(process.env.PORT || 3000), '0.0.0.0');
  java.on('error', () => { server.close(); process.exitCode = 1; });
  java.on('exit', code => { server.close(); process.exitCode = code || 0; });
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
    server.close();
    java.kill('SIGTERM');
    setTimeout(() => process.exit(0), 28000).unref();
  });
}
module.exports = { createStartupProxy };
