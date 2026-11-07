import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { gzipSync } from "node:zlib";
const root = resolve("dist-ux-demo");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};
const port = Number(process.env.UX_PORT ?? 4173);
await stat(resolve(root, "index.html"));
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://127.0.0.1").pathname,
    );
    let target = resolve(root, `.${pathname}`);
    if (target !== root && !target.startsWith(root + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (!extname(pathname)) target = resolve(root, "index.html");
    const body = await readFile(target);
    const type = mime[extname(target)] ?? "application/octet-stream";
    const compressed =
      /(?:text|javascript)/.test(type) &&
      /gzip/.test(req.headers["accept-encoding"] ?? "");
    const output = compressed ? gzipSync(body) : body;
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": output.length,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
      Vary: "Accept-Encoding",
      ...(compressed ? { "Content-Encoding": "gzip" } : {}),
    });
    res.end(output);
  } catch {
    res.writeHead(404);
    res.end("Não encontrado");
  }
}).listen(port, "127.0.0.1", () =>
  console.log(
    `Demonstração local: http://127.0.0.1:${port} (gzip; sem proxy de API)`,
  ),
);
