import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { writeFile } from "node:fs/promises";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "playwright"
);
const b = await chromium.launch();
const p = await b.newPage({
  viewport: { width: 1024, height: 900 },
  timezoneId: "Asia/Tokyo",
});
await p.goto("http://127.0.0.1:4173/agenda");
await p.getByRole("heading", { name: "Agenda", exact: true }).waitFor();
await p.waitForTimeout(750);
await p
  .getByRole("group", { name: "Visualização da agenda" })
  .getByRole("button", { name: "Grade semanal", exact: true })
  .click();
const grid = p.getByRole("region", {
  name: "Agenda semanal com rolagem horizontal",
});
await grid.waitFor();
await grid.focus();
await p.keyboard.press("ArrowRight");
assert(
  await grid.evaluate(
    (el) => el.scrollWidth > el.clientWidth && el.scrollLeft > 0,
  ),
);
assert(
  await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await p.locator(".schedule-event").first().focus();
await p.keyboard.press("Enter");
await p.getByRole("dialog").waitFor();
await p.keyboard.press("Escape");
assert(
  await p
    .locator(".schedule-event")
    .first()
    .evaluate((el) => el === document.activeElement),
);
await writeFile(
  "test-results/ux-week.json",
  JSON.stringify(
    {
      date: new Date().toISOString(),
      checks: [
        "Grade semanal com rolagem localizada operável por teclado",
        "Página sem rolagem horizontal a 1024px",
        "Consulta da grade abre com Enter",
        "Escape restaura foco à consulta",
      ],
      passed: true,
    },
    null,
    2,
  ),
);
console.log("4 verificações adicionais da grade passaram.");
await b.close();
