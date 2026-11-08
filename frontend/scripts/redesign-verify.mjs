import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { mockApi, date } from "./redesign-fixtures.mjs";
const dir = "../output/redesign/verification";
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
const errors = [];
async function check(name, run) {
  try {
    await run();
    results.push({ name, ok: true });
    console.log("PASS", name);
  } catch (error) {
    results.push({ name, ok: false, error: String(error) });
    console.log("FAIL", name, String(error).slice(0, 300));
  }
}
async function open(path, options = {}) {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    timezoneId: "Asia/Tokyo",
    reducedMotion: "reduce",
    ...options,
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(String(error)));
  const state = await mockApi(page, { auth: path.includes("agenda") });
  await page.goto(`http://127.0.0.1:5176${path}`);
  await page.locator("h1").first().waitFor();
  return { context, page, state };
}
for (const [width, height] of [
  [320, 812],
  [375, 812],
  [768, 600],
  [1024, 768],
  [1440, 900],
  [900, 375],
])
  for (const [name, path] of [
    ["home", "/"],
    ["booking", "/agendar/demo"],
    ["agenda", "/agenda"],
  ]) {
    await check(`${name} ${width}x${height}`, async () => {
      const { page, context } = await open(path, {
        viewport: { width, height },
      });
      await page.waitForTimeout(350);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (name === "home" && width === 768) {
        const box = await page
          .locator(".landing-carousel-controls")
          .boundingBox();
        expect(box.y + box.height).toBeLessThanOrEqual(height);
      }
      if (name === "agenda") {
        await expect(page.getByText("09:00 · Marina Costa")).toBeVisible();
        await expect(page.locator(".agenda-mobile-card").first()).toContainText(
          "09:00",
        );
      }
      await page.screenshot({
        path: `${dir}/${name}-${width}x${height}.png`,
        fullPage: true,
      });
      await context.close();
    });
  }
await check(
  "hero: automatic 5s, hover and focus pause, reduced motion",
  async () => {
    const { context, page } = await open("/", {
      reducedMotion: "no-preference",
      viewport: { width: 1440, height: 900 },
    });
    await page.clock.install();
    await page.reload();
    await page.locator("h1").waitFor();
    await page.mouse.move(10, 10);
    const first = await page.locator("h1").textContent();
    await page.clock.fastForward(5100);
    await expect(page.locator("h1")).not.toHaveText(first);
    await page.locator(".landing-hero").hover();
    const hovered = await page.locator("h1").textContent();
    await page.clock.fastForward(6000);
    await expect(page.locator("h1")).toHaveText(hovered);
    await page.mouse.move(10, 10);
    await page.locator(".landing-hero .landing-cta").focus();
    await page.clock.fastForward(6000);
    await expect(page.locator("h1")).toHaveText(hovered);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(
      page.getByRole("button", { name: "Reproduzir carrossel" }),
    ).toBeVisible();
    await context.close();
  },
);
for (const [name, path] of [
  ["home", "/"],
  ["booking", "/agendar/demo"],
  ["agenda", "/agenda"],
])
  await check(`${name}: dark theme persists, text 200%`, async () => {
    const { context, page } = await open(path);
    await page.getByRole("button", { name: "Tema escuro" }).click();
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Tema escuro" }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.screenshot({ path: `${dir}/${name}-dark.png`, fullPage: true });
    await page.addStyleTag({ content: "html { font-size:200% !important; }" });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${dir}/${name}-text200.png`,
      fullPage: true,
    });
    await context.close();
  });
await check(
  "booking: calendar, native date, conflict, focus, preserved inputs, edit, success",
  async () => {
    const { context, page, state } = await open("/agendar/demo", {
      hasTouch: true,
    });
    await page.getByRole("radio", { name: /Avaliação odontológica/ }).check();
    await page.getByLabel("Profissional", { exact: true }).selectOption("d1");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.getByRole("group", { name: "Calendário" })).toBeVisible();
    const day = page.locator(".date-picker-inline-day:not(:disabled)").first();
    await day.focus();
    await page.keyboard.press("Space");
    await page.getByLabel("Ou digite a data").fill(date);
    await page.getByRole("radio", { name: "09:00" }).check();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.getByLabel("Nome completo").fill("Pessoa de Teste");
    await page.getByLabel("Telefone / WhatsApp").fill("11999990000");
    await page.getByLabel("E-mail (opcional)").fill("teste@example.invalid");
    await page.getByRole("button", { name: "Revisar solicitação" }).click();
    await page.getByRole("button", { name: "Editar dados" }).click();
    await expect(page.getByLabel("Nome completo")).toHaveValue(
      "Pessoa de Teste",
    );
    await page.getByRole("button", { name: "Revisar solicitação" }).click();
    state.scenario = "conflict";
    await page.getByRole("button", { name: "Enviar solicitação" }).click();
    await expect(page.getByRole("alert")).toContainText(
      "Seus dados foram mantidos",
    );
    await expect(page.getByRole("alert")).toBeFocused();
    await page.screenshot({
      path: `dir/conflict.png`.replace("dir", dir),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Escolher outro horário" }).click();
    state.scenario = "normal";
    await page.getByRole("radio", { name: "10:00" }).check();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.getByLabel("Nome completo")).toHaveValue(
      "Pessoa de Teste",
    );
    await expect(page.getByLabel("E-mail (opcional)")).toHaveValue(
      "teste@example.invalid",
    );
    await page.getByRole("button", { name: "Revisar solicitação" }).click();
    await page.screenshot({
      path: `${dir}/booking-review.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Enviar solicitação" }).click();
    await expect(
      page.getByRole("heading", { name: "Solicitação enviada" }),
    ).toBeFocused();
    await expect(
      page.getByText(
        "O envio ainda não confirma o atendimento. Aguarde o retorno da equipe.",
      ),
    ).toBeVisible();
    expect(state.posts).toHaveLength(2);
    await page.screenshot({
      path: `${dir}/booking-success.png`,
      fullPage: true,
    });
    await context.close();
  },
);
await check(
  "agenda: persisted filters, grid/list, focus trap and keyboard reschedule",
  async () => {
    const { context, page } = await open("/agenda", {
      viewport: { width: 1440, height: 900 },
    });
    await page.getByLabel("Filtrar agenda por dentista").selectOption("d1");
    await page.getByLabel("Filtrar por situação").selectOption("SCHEDULED");
    await page.getByRole("button", { name: "Semana", exact: true }).click();
    await page.getByRole("button", { name: "Grade", exact: true }).click();
    await page.reload();
    await expect(page.getByLabel("Filtrar agenda por dentista")).toHaveValue(
      "d1",
    );
    await expect(page.getByLabel("Filtrar por situação")).toHaveValue(
      "SCHEDULED",
    );
    await expect(
      page.getByRole("button", { name: "Semana", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("region", { name: "Grade de consultas" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Lista", exact: true }).click();
    const card = page.locator(".agenda-mobile-card").first();
    await card.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Shift+Tab");
    expect(
      await page
        .getByRole("dialog")
        .evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
    await page.getByRole("button", { name: /Reagendar/ }).click();
    expect(await page.getByRole("dialog").count()).toBe(2);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: /Reagendar/ })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(card).toBeFocused();
    await context.close();
  },
);
for (const scenario of ["empty", "error"])
  await check(`booking availability ${scenario}`, async () => {
    const { context, page, state } = await open("/agendar/demo");
    state.scenario = scenario;
    await page.getByRole("radio", { name: /Avaliação odontológica/ }).check();
    await page.getByLabel("Profissional", { exact: true }).selectOption("d1");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(
      page.getByText(
        scenario === "empty"
          ? "Nenhum horário disponível neste dia. Escolha outra data."
          : "Não foi possível consultar os horários. Tente novamente.",
      ),
    ).toBeVisible({ timeout: 15000 });
    await page.screenshot({
      path: `${dir}/booking-${scenario}.png`,
      fullPage: true,
    });
    await context.close();
  });
await check("no uncaught browser errors", async () =>
  expect(errors).toEqual([]),
);
await writeFile(
  `${dir}/results.json`,
  JSON.stringify(
    { browser: browser.version(), timezone: "Asia/Tokyo", results, errors },
    null,
    2,
  ),
);
await browser.close();
if (results.some((r) => !r.ok)) process.exitCode = 1;
