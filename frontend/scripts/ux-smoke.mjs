import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium, webkit } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "playwright"
);
const base = process.env.UX_URL ?? "http://127.0.0.1:4173";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
await mkdir("test-results", { recursive: true });
const results = [],
  errors = [],
  external = [];
function check(name, condition) {
  assert(condition, name);
  results.push({ name, passed: true });
  console.log("PASS", name);
}
async function settle(page) {
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.waitForFunction(() => !document.querySelector(".app-loading"));
  await page.waitForTimeout(650);
}
async function noOverflow(page, name) {
  const value = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  check(name, value.scroll <= value.width + 1);
}
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 375, height: 900 },
  timezoneId: "Asia/Tokyo",
  hasTouch: true,
});
context.on("request", (req) => {
  if (!req.url().startsWith(base)) external.push(req.url());
});
const page = await context.newPage();
page.setDefaultTimeout(12000);
page.on("pageerror", (e) => errors.push(e.message));
for (const width of process.env.UX_FLOWS_ONLY
  ? []
  : [320, 375, 600, 768, 900, 1024, 1280, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  for (const [name, path] of [
    ["home", "/"],
    ["booking", "/agendar/demonstracao"],
    ["agenda", "/agenda"],
  ]) {
    await page.goto(base + path);
    await settle(page);
    await noOverflow(page, `${name} ${width}px sem estouro`);
    if (width === 375 || width === 1440)
      await page.screenshot({
        path: `test-results/${name}-${width}.png`,
        fullPage: true,
      });
  }
}
await page.setViewportSize({ width: 375, height: 900 });
await page.goto(base + "/");
await settle(page);
await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
check(
  "Menu expandido",
  (await page
    .getByRole("button", { name: "Fechar menu", exact: true })
    .getAttribute("aria-expanded")) === "true",
);
await page.keyboard.press("Escape");
check(
  "Escape devolve foco ao menu",
  await page
    .getByRole("button", { name: "Abrir menu", exact: true })
    .evaluate((el) => el === document.activeElement),
);
await page.getByRole("button",{name:"Abrir menu",exact:true}).click();
await page.getByRole("navigation",{name:"Menu móvel",exact:true}).getByRole("link",{name:"Acesso da equipe",exact:true}).click();
await page.getByRole("heading",{name:"Agenda",exact:true}).waitFor();
check("Acesso da equipe da home abre a recepção simulada",true);
await page.goto(base+'/');await settle(page);
await page
  .getByRole("link", { name: "Agendar avaliação", exact: true })
  .click();
await settle(page);
const tomorrow = new Date();
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
const day = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(tomorrow);
async function fillBooking(waitSlots = true) {
  await page
    .getByRole("combobox", { name: "Avaliação / procedimento", exact: true })
    .selectOption("demo-evaluation");
  await page
    .getByRole("combobox", { name: "Profissional", exact: true })
    .selectOption("demo-pro-1");
  await page.getByLabel("Data", { exact: true }).fill(day);
  await page
    .getByLabel("Nome completo", { exact: true })
    .fill("Paciente Teste");
  await page
    .getByLabel("Telefone de contato", { exact: true })
    .fill("00000000000");
  if (waitSlots) await page.getByRole("radio").first().waitFor();
}
await fillBooking();
await page.getByRole("radio").first().focus();
await page.keyboard.press("ArrowRight");
check(
  "Horários por setas do teclado",
  await page.getByRole("radio").nth(1).isChecked(),
);
await page.screenshot({
  path: "test-results/booking-filled-375.png",
  fullPage: true,
});
await page.setViewportSize({ width: 1440, height: 900 });
await page.screenshot({
  path: "test-results/booking-filled-1440.png",
  fullPage: true,
});
await page.setViewportSize({ width: 375, height: 900 });
await page.evaluate(() =>
  sessionStorage.setItem("odonto-ux-scenario", "conflict"),
);
await page.getByRole("button", { name: "Revisar solicitação" }).click();
check(
  "Foco na revisão",
  await page
    .getByRole("heading", { name: "Revise sua solicitação" })
    .evaluate((el) => el === document.activeElement),
);
await page
  .getByRole("button", { name: "Enviar solicitação", exact: true })
  .click();
await page
  .getByRole("alert")
  .filter({ hasText: "acabou de ficar indisponível" })
  .waitFor();
check(
  "Conflito preserva identificação",
  (await page.getByLabel("Nome completo", { exact: true }).inputValue()) ===
    "Paciente Teste",
);
const conflictNotice = page.getByRole("alert").filter({ hasText: "acabou de ficar indisponível" });
await page.waitForFunction(() => document.activeElement?.classList.contains("public-booking-error"));
check("Conflito leva o foco ao aviso", await conflictNotice.evaluate((el) => el === document.activeElement));
await page.getByRole("button", { name: "Escolher outro horário" }).click();
check("Recuperação leva foco aos horários", await page.getByRole("radio").first().evaluate((el) => el === document.activeElement));
await page.getByRole("radio").last().check();
await page.getByRole("button", { name: "Revisar solicitação" }).click();
await page.evaluate(() =>
  sessionStorage.setItem("odonto-ux-scenario", "error"),
);
await page
  .getByRole("button", { name: "Enviar solicitação", exact: true })
  .click();
await page
  .getByRole("alert")
  .filter({ hasText: "Não foi possível enviar" })
  .waitFor();
check(
  "Erro mantém revisão e dados",
  await page
    .getByRole("heading", { name: "Revise sua solicitação" })
    .isVisible(),
);
await page.evaluate(() => sessionStorage.removeItem("odonto-ux-scenario"));
await page
  .getByRole("button", { name: "Enviar solicitação", exact: true })
  .click();
await page.getByRole("heading", { name: "Solicitação enviada" }).waitFor();
check(
  "Sucesso informa pendência",
  await page.getByText("Aguardando aceite", { exact: true }).isVisible(),
);
await page.screenshot({
  path: "test-results/booking-success-375.png",
  fullPage: true,
});
await page.goto(base + "/agenda");
await settle(page);
await page.getByLabel("Ir para data", { exact: true }).fill(day);
await page.getByRole("button").filter({ hasText: "Paciente Teste" }).waitFor();
check(
  "Solicitação visível à recepção na mesma aba",
  (await page
    .getByRole("button")
    .filter({ hasText: "Paciente Teste" })
    .count()) === 1,
);
await page.locator(".agenda-mobile-filters summary").click();
await page
  .getByRole("combobox", { name: "Situação", exact: true })
  .selectOption("PENDING");
check(
  "Filtro de situação",
  await page
    .getByRole("button")
    .filter({ hasText: "Paciente Teste" })
    .isVisible(),
);
await page.getByRole("button").filter({ hasText: "Paciente Teste" }).click();
await page.getByRole("dialog").waitFor();
await page
  .getByLabel("Remarcar para (horário de Brasília)")
  .fill(`${day}T17:00`);
await page
  .getByRole("button", { name: "Remarcar consulta", exact: true })
  .click();
await page.waitForTimeout(500);
check(
  "Remarcação na simulação",
  (await page.getByRole("dialog").getByText(/17:00/).count()) > 0,
);
await page
  .getByLabel("Remarcar para (horário de Brasília)")
  .fill(`${day}T09:00`);
await page
  .getByRole("button", { name: "Remarcar consulta", exact: true })
  .click();
await page
  .getByText(
    "Não foi possível remarcar o agendamento. Verifique se o horário está livre.",
    { exact: true },
  )
  .waitFor();
check(
  "Falha na remarcação preserva horário anterior na simulação",
  (await page.getByRole("dialog").getByText(/17:00/).count()) > 0,
);
page.once("dialog", (dialog) => dialog.accept());
await page
  .getByRole("button", { name: "Aceitar agendamento", exact: true })
  .click();
await page.waitForTimeout(500);
check(
  "Aceite não é confirmação de presença",
  await page
    .getByRole("dialog")
    .getByText("Agendada", { exact: true })
    .isVisible(),
);
await page.keyboard.press("Escape");
check("Escape fecha diálogo", (await page.getByRole("dialog").count()) === 0);
await page
  .getByRole("combobox", { name: "Situação", exact: true })
  .selectOption("");
await page.getByRole("button").filter({ hasText: "Paciente Teste" }).click();
page.once("dialog", (dialog) => dialog.accept());
await page
  .getByRole("button", { name: "Cancelar agendamento", exact: true })
  .click();
await page.waitForTimeout(500);
await page
  .locator(".badge")
  .filter({ hasText: /^Cancelada$/ })
  .waitFor();
check(
  "Cancelamento na simulação",
  await page
    .locator(".badge")
    .filter({ hasText: /^Cancelada$/ })
    .isVisible(),
);
await page
  .getByRole("button", { name: "Novo agendamento", exact: true })
  .click();
await page.getByRole("dialog").waitFor();
await page
  .getByRole("combobox", { name: "Paciente", exact: true })
  .selectOption("demo-patient-1");
await page
  .getByRole("combobox", { name: "Dentista", exact: true })
  .selectOption("demo-pro-1");
await page
  .getByLabel("Data e horário de Brasília", { exact: true })
  .fill(`${day}T18:00`);
await page
  .getByRole("combobox", { name: "Procedimento", exact: true })
  .selectOption("demo-evaluation");
await page
  .getByRole("button", { name: "Agendar consulta", exact: true })
  .click();
await page.getByText("18:00", { exact: true }).waitFor();
check(
  "Agendamento manual na simulação",
  await page.getByText("18:00", { exact: true }).isVisible(),
);
check(
  "Formulário manual acessível no celular",
  (await page.getByRole("dialog").count()) === 0,
);
for (const scenario of ["empty", "error"]) {
  await page.evaluate(
    (s) => sessionStorage.setItem("odonto-ux-scenario", s),
    scenario,
  );
  await page.goto(base + "/agendar/demonstracao");
  await settle(page);
  await fillBooking(false);
  await page.waitForTimeout(450);
  check(
    `Disponibilidade ${scenario}`,
    await page
      .getByText(
        scenario === "empty"
          ? "Nenhum horário livre neste dia. Escolha outra data."
          : "Não foi possível carregar os horários.",
        { exact: true },
      )
      .isVisible(),
  );
}
await page.evaluate(() => sessionStorage.removeItem("odonto-ux-scenario"));
// Browser page scaling is separate from text enlargement.
for (const path of ["/", "/agendar/demonstracao", "/agenda"]) {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(base + path);
  await settle(page);
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  await noOverflow(page, `${path} texto 200% sem estouro`);
}
await page.setViewportSize({ width: 900, height: 375 });
await page.goto(base + "/agenda");
await settle(page);
await noOverflow(page, "Agenda paisagem 900x375");
check("Sem erros JavaScript", errors.length === 0);
check("Sem requisições externas", external.length === 0);
const zoomContext = await browser.newContext({
  viewport: { width: 384, height: 450 },
  deviceScaleFactor: 2,
  timezoneId: "America/Sao_Paulo",
});
const zoomPage = await zoomContext.newPage();
for (const path of ["/", "/agendar/demonstracao", "/agenda"]) {
  await zoomPage.goto(base + path);
  await settle(zoomPage);
  await noOverflow(
    zoomPage,
    `${path} zoom 200% emulado (768px físicos / 384px CSS, escala 2)`,
  );
}
await zoomContext.close();
await context.close();
await browser.close();
const wk = await webkit.launch({ headless: true });
const wc = await wk.newContext({
  viewport: { width: 375, height: 900 },
  timezoneId: "America/Los_Angeles",
});
const wp = await wc.newPage();
wp.on("pageerror", (e) => errors.push(e.message));
for (const path of ["/", "/agendar/demonstracao", "/agenda"]) {
  await wp.goto(base + path);
  await settle(wp);
  await noOverflow(wp, `WebKit ${path} 375px`);
}
await wk.close();
await writeFile(
  "test-results/ux-results.json",
  JSON.stringify(
    {
      date: new Date().toISOString(),
      chromium: "bundled Playwright Chromium",
      results,
      errors,
      external,
    },
    null,
    2,
  ),
);
console.log(
  `${results.length} verificações passaram; ${errors.length} erros JS; ${external.length} requisições externas.`,
);
