import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "playwright"
);
const base = process.env.UX_URL ?? "http://127.0.0.1:4173";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const out = "test-results/performance";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const runs = [];
for (const mode of process.env.UX_DIAG ? ["mobile"] : ["mobile", "desktop"])
  for (const [route, path] of [
    ["home", "/"],
    ["agendamento", "/agendar/demonstracao"],
    ["agenda", "/agenda"],
  ])
    for (let run = 1; run <= (process.env.UX_DIAG ? 1 : 3); run++) {
      const context = await browser.newContext({
        viewport:
          mode === "mobile"
            ? { width: 375, height: 812 }
            : { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        timezoneId: "America/Sao_Paulo",
      });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      await cdp.send("Emulation.setCPUThrottlingRate", {
        rate: mode === "mobile" ? 4 : 1,
      });
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: mode === "mobile" ? 150 : 20,
        downloadThroughput: mode === "mobile" ? 200000 : 1250000,
        uploadThroughput: mode === "mobile" ? 93750 : 625000,
      });
      await page.addInitScript(() => {
        window.__lab = { lcp: null, cls: 0, shifts: [] };
        let session = 0,
          first = 0,
          last = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            window.__lab.lcp = entry.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            if (e.hadRecentInput) continue;
            window.__lab.shifts.push({
              value: e.value,
              sources: e.sources?.map((s) => ({
                node: s.node?.outerHTML.slice(0, 180),
                previous: s.previousRect,
                current: s.currentRect,
              })),
            });
            if (e.startTime - last > 1000 || e.startTime - first > 5000) {
              session = 0;
              first = e.startTime;
            }
            session += e.value;
            last = e.startTime;
            window.__lab.cls = Math.max(window.__lab.cls, session);
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      if (run === 1 && mode === "mobile")
        await browser.startTracing(page, {
          path: `${out}/${route}-mobile-trace.json`,
          screenshots: false,
          categories: ["devtools.timeline", "blink.user_timing", "loading"],
        });
      await page.goto(base + path);
      await page.getByRole("heading", { level: 1 }).waitFor();
      await page.waitForTimeout(2500);
      const data = await page.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0];
        const entries = performance.getEntriesByType("resource");
        const bytes = {
          total: nav.transferSize,
          js: 0,
          css: 0,
          fonts: 0,
          images: 0,
        };
        for (const r of entries) {
          bytes.total += r.transferSize;
          const name = new URL(r.name).pathname;
          if (name.endsWith(".js")) bytes.js += r.encodedBodySize;
          else if (name.endsWith(".css")) bytes.css += r.encodedBodySize;
          else if (name.endsWith(".woff2")) bytes.fonts += r.encodedBodySize;
          else if (/\.(webp|png|svg)$/.test(name))
            bytes.images += r.encodedBodySize;
        }
        return {
          ...window.__lab,
          fcp:
            performance.getEntriesByName("first-contentful-paint")[0]
              ?.startTime ?? null,
          bytes,
          resources: entries.map((r) => ({
            url: new URL(r.name).pathname,
            transferred: r.transferSize,
            encoded: r.encodedBodySize,
            decoded: r.decodedBodySize,
          })),
        };
      });
      if (run === 1 && mode === "mobile") await browser.stopTracing();
      runs.push({ mode, route, run, ...data });
      console.log(
        mode,
        route,
        run,
        JSON.stringify({
          lcp: data.lcp,
          cls: data.cls,
          fcp: data.fcp,
          bytes: data.bytes,
          ...(process.env.UX_DIAG ? { shifts: data.shifts } : {}),
        }),
      );
      await context.close();
    }
if (process.env.UX_DIAG) {
  await browser.close();
  process.exit(0);
}
const summary = [];
for (const mode of process.env.UX_DIAG ? ["mobile"] : ["mobile", "desktop"])
  for (const route of ["home", "agendamento", "agenda"]) {
    const selected = runs.filter((r) => r.mode === mode && r.route === route);
    const metrics = {};
    for (const key of ["lcp", "fcp", "cls"]) {
      const values = selected.map((r) => r[key]).sort((a, b) => a - b);
      metrics[key] = { median: values[1], min: values[0], max: values[2] };
    }
    summary.push({ mode, route, ...metrics, bytes: selected[0].bytes });
  }
const html = await readFile("dist-ux-demo/index.html");
await writeFile(
  `${out}/results.json`,
  JSON.stringify(
    {
      date: new Date().toISOString(),
      browser: browser.version(),
      buildIndexSha256: createHash("sha256").update(html).digest("hex"),
      conditions: {
        mobile: {
          viewport: "375x812",
          cpu: 4,
          latencyMs: 150,
          downloadBytesPerSecond: 200000,
        },
        desktop: {
          viewport: "1440x900",
          cpu: 1,
          latencyMs: 20,
          downloadBytesPerSecond: 1250000,
        },
        cache: "disabled, new context per run",
        server: "loopback HTTP, gzip, no-store",
        backend:
          "in-browser simulation, 250ms artificial delay; API not network-throttled",
        inp: "not measured",
        fieldMetrics: "no sample",
      },
      summary,
      runs,
    },
    null,
    2,
  ),
);
await browser.close();
console.log("Performance registrada em " + out + "/results.json");
