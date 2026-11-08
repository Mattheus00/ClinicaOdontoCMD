import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { mockApi } from "./redesign-fixtures.mjs";
const phase = process.argv[2] || "after";
const dir = `../output/redesign/${phase}`;
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
for (const [name, path] of [
  ["home", "/"],
  ["booking", "/agendar/demo"],
  ["agenda", "/agenda"],
])
  for (let run = 1; run <= 3; run++) {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      timezoneId: "America/Sao_Paulo",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await mockApi(page, { auth: name === "agenda" });
    await page.addInitScript(() => {
      window.__metrics = { lcp: 0, cls: 0 };
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.__metrics.lcp = e.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          if (!e.hadRecentInput) window.__metrics.cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: 200000,
      uploadThroughput: 93750,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.goto(
      `${process.env.REDESIGN_BASE_URL || "http://127.0.0.1:5176"}${path}`,
      { waitUntil: "load", timeout: 90000 },
    );
    await page.waitForTimeout(2500);
    const metrics = await page.evaluate(() => ({
      ...window.__metrics,
      fcp: performance.getEntriesByName("first-contentful-paint")[0]?.startTime,
      resources: performance
        .getEntriesByType("resource")
        .map((r) => ({
          name: r.name,
          bytes: r.encodedBodySize,
          transfer: r.transferSize,
          duration: r.duration,
        })),
    }));
    results.push({ name, run, ...metrics });
    console.log(name, run, metrics.lcp, metrics.cls);
    await context.close();
  }
await browser.close();
await writeFile(
  `${dir}/performance.json`,
  JSON.stringify(
    {
      browser: browser.version(),
      profile: {
        width: 375,
        height: 812,
        latency: 150,
        download: 200000,
        cpu: 4,
        api: "synthetic, routed outside bandwidth emulation",
      },
      results,
    },
    null,
    2,
  ),
);
