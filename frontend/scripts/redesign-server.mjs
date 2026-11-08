import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { gzipSync } from "node:zlib";
const root = resolve(process.argv[2] || "dist");
const port = Number(process.argv[3] || 5176);
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};
http
  .createServer(async (req, res) => {
    const path = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (path.startsWith("/api/")) {
      res.writeHead(503);
      res.end("Test server has no backend");
      return;
    }
    const file = resolve(root, `.${path}`);
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      let body;
      let type = types[extname(file)] || "application/octet-stream";
      try {
        body = await readFile(file);
      } catch {
        if (extname(file)) throw Error("missing");
        body = await readFile(resolve(root, "index.html"));
        type = types[".html"];
      }
      const zipped = gzipSync(body);
      res.writeHead(200, {
        "Content-Type": type,
        "Content-Encoding": "gzip",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      });
      res.end(zipped);
    } catch {
      res.writeHead(404);
      res.end();
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Isolated production build: http://127.0.0.1:${port}`),
  );
