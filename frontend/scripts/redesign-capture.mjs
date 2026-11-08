import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { mockApi } from "./redesign-fixtures.mjs";
const phase = process.argv[2] || "after";
const dir = `../output/redesign/${phase}`;
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
for (const width of [375, 1440])
  for (const [name, path] of [
    ["home", "/"],
    ["booking", "/agendar/demo"],
    ["agenda", "/agenda"],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      timezoneId: "America/Sao_Paulo",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await mockApi(page, { auth: name === "agenda" });
    await page.goto(`http://127.0.0.1:5176${path}`);
    await page.waitForTimeout(1800);
    await page.screenshot({
      path: `${dir}/${name}-${width}.png`,
      fullPage: true,
    });
    results.push({
      name,
      width,
      overflow: await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      title: await page.title(),
    });
    await context.close();
  }
await browser.close();
await writeFile(`${dir}/captures.json`, JSON.stringify(results, null, 2));
console.log(results);
