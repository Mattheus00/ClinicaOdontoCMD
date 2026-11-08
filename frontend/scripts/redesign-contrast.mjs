import { chromium } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
import { mockApi } from "./redesign-fixtures.mjs";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
for (const dark of [false, true])
  for (const [name, path, selectors] of [
    [
      "home",
      "/",
      [
        ".landing-nav a",
        ".landing-evaluation h2",
        ".landing-evaluation-copy p",
        ".landing-text-link",
        ".landing-steps p",
        ".landing-step-number",
        ".landing-faq summary",
        ".landing-footer-bottom",
      ],
    ],
    [
      "booking",
      "/agendar/demo",
      [
        ".booking-main h1",
        ".booking-intro",
        ".booking-kicker",
        ".booking-services legend",
        ".booking-service strong",
        ".booking-service small",
        ".booking-summary dd",
        ".booking-summary-note p",
        ".booking-form-actions .btn-primary",
      ],
    ],
    [
      "agenda",
      "/agenda",
      [
        ".page-title",
        ".page-subtitle",
        ".agenda-overview span",
        ".agenda-overview strong",
        ".agenda-results-bar p",
        ".agenda-mobile-card-time strong",
        ".agenda-mobile-card-body strong",
        ".agenda-mobile-card-body .badge",
      ],
    ],
  ]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await mockApi(page, { auth: name === "agenda" });
    await page.goto(`http://127.0.0.1:5176${path}`);
    await page.locator("h1").waitFor();
    await page.waitForTimeout(250);
    if (dark) await page.getByRole("button", { name: "Tema escuro" }).click();
    for (const selector of selectors)
      results.push({
        name,
        dark,
        selector,
        ...(await page
          .locator(selector)
          .first()
          .evaluate((el) => {
            const rgb = (color) => color.match(/[\d.]+/g).map(Number);
            const compose = (fg, bg) => {
              const a = fg[3] ?? 1;
              return fg.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a));
            };
            let ancestors = [];
            for (let e = el; e; e = e.parentElement) ancestors.push(e);
            let bg = [255, 255, 255];
            for (const e of ancestors.reverse())
              bg = compose(rgb(getComputedStyle(e).backgroundColor), bg);
            const style = getComputedStyle(el);
            const fg = compose(rgb(style.color), bg);
            const luminance = (c) =>
              c
                .map((n) => {
                  const v = n / 255;
                  return v <= 0.04045
                    ? v / 12.92
                    : ((v + 0.055) / 1.055) ** 2.4;
                })
                .reduce(
                  (sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i],
                  0,
                );
            const a = luminance(fg),
              b = luminance(bg);
            const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
            const size = parseFloat(style.fontSize);
            const required =
              size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700)
                ? 3
                : 4.5;
            return {
              ratio: Number(ratio.toFixed(2)),
              required,
              pass: ratio >= required,
              fg,
              bg,
            };
          })),
      });
    await context.close();
  }
await mkdir("../output/redesign/verification", { recursive: true });
await writeFile(
  "../output/redesign/verification/contrast.json",
  JSON.stringify(results, null, 2),
);
console.log(
  JSON.stringify(
    { checked: results.length, failures: results.filter((r) => !r.pass) },
    null,
    2,
  ),
);
await browser.close();
if (results.some((r) => !r.pass)) process.exitCode = 1;
