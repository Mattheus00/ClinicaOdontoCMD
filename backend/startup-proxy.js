const http = require('http');

const backend = { host: '127.0.0.1', port: 8080 };
const maxStartupWaitMs = 30_000;
const retryDelayMs = 250;
const maxRequestBodyBytes = 10 * 1024 * 1024;

function forward(request, response, body, startedAt) {
  const headers = { ...request.headers };
  headers.host = request.headers.host || 'localhost';

  const upstream = http.request(
    {
      host: backend.host,
      port: backend.port,
      method: request.method,
      path: request.url,
      headers,
    },
    (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
      upstreamResponse.pipe(response);
    },
  );

  upstream.on('error', (error) => {
    const retryable = ['ECONNREFUSED', 'ECONNRESET', 'EPIPE'].includes(error.code);
    if (retryable && Date.now() - startedAt < maxStartupWaitMs && !response.writableEnded) {
      setTimeout(() => forward(request, response, body, startedAt), retryDelayMs);
      return;
    }

    if (!response.headersSent) {
      response.writeHead(503, { 'content-type': 'application/json; charset=utf-8' });
    }
    response.end(JSON.stringify({ message: 'API temporariamente indisponível. Tente novamente.' }));
  });

  upstream.end(body);
}

http
  .createServer((request, response) => {
    const chunks = [];
    let size = 0;

    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxRequestBodyBytes) {
        response.writeHead(413, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ message: 'Requisição muito grande.' }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on('end', () => {
      if (!response.writableEnded) {
        forward(request, response, Buffer.concat(chunks), Date.now());
      }
    });
  })
  .listen(Number(process.env.PORT || 8080), '0.0.0.0');
