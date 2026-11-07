import { pathToFileURL } from "node:url";
import { writeFile, mkdir } from "node:fs/promises";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "playwright"
);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 375, height: 900 } });
const runs = [];
for (const [path, state] of [
  ["/", "normal"],
  ["/agendar/demonstracao", "normal"],
  ["/agenda", "normal"],
  ["/agendar/demonstracao", "selecionado"],
  ["/agendar/demonstracao", "erro"],
  ["/agenda", "detalhes"],
]) {
  await p.goto("http://127.0.0.1:4173" + path);
  await p.getByRole("heading", { level: 1 }).waitFor();
  await p.waitForTimeout(800);
  if (state === "selecionado" || state === "erro") {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 1);
    const day = d.toISOString().slice(0, 10);
    await p
      .getByRole("combobox", { name: "Avaliação / procedimento", exact: true })
      .selectOption("demo-evaluation");
    await p
      .getByRole("combobox", { name: "Profissional", exact: true })
      .selectOption("demo-pro-1");
    await p.getByLabel("Data", { exact: true }).fill(day);
    await p.getByRole("radio").first().check();
    await p.getByRole("radio").first().focus();
    await p
      .getByLabel("Nome completo", { exact: true })
      .fill("Paciente Contraste");
    await p
      .getByLabel("Telefone de contato", { exact: true })
      .fill("00000000000");
    if (state === "erro") {
      await p.getByRole("button", { name: "Revisar solicitação" }).click();
      await p.evaluate(() =>
        sessionStorage.setItem("odonto-ux-scenario", "error"),
      );
      await p
        .getByRole("button", { name: "Enviar solicitação", exact: true })
        .click();
      await p.getByRole("alert").waitFor();
      await p.evaluate(() => sessionStorage.removeItem("odonto-ux-scenario"));
    } else await p.getByRole("button", { name: "Revisar solicitação" }).hover();
  }
  if (state === "detalhes") {
    await p
      .getByRole("button")
      .filter({ hasText: "Ana Exemplo" })
      .first()
      .click();
    await p.getByRole("dialog").waitFor();
  }
  runs.push({
    path,
    state,
    results: await p.evaluate(() => {
      const rgb = (s) => (s.match(/[\d.]+/g) ?? []).map(Number);
      const luminance = (c) =>
        c
          .slice(0, 3)
          .map((v) => {
            v /= 255;
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          })
          .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
      const failures = [],
        skipped = [];
      let checked = 0;
      for (const el of document.querySelectorAll("body *")) {
        if (
          ![...el.childNodes].some(
            (n) => n.nodeType === 3 && n.textContent.trim(),
          ) ||
          !el.getClientRects().length ||
          el.closest("[disabled]")
        )
          continue;
        const style = getComputedStyle(el);
        if (style.visibility === "hidden") continue;
        let layers = [],
          node = el,
          gradient = false;
        while (node) {
          const s = getComputedStyle(node);
          if (s.backgroundImage !== "none") gradient = true;
          layers.push(rgb(s.backgroundColor));
          node = node.parentElement;
        }
        if (gradient) {
          skipped.push(el.textContent.trim().slice(0, 70));
          continue;
        }
        let bg = [255, 255, 255];
        for (const c of layers.reverse()) {
          const a = c[3] ?? 1;
          bg = bg.map((v, i) => c[i] * a + v * (1 - a));
        }
        const fg = rgb(style.color);
        const alpha = fg[3] ?? 1;
        const color = fg.map((v, i) =>
          i < 3 ? v * alpha + bg[i] * (1 - alpha) : v,
        );
        const a = luminance(color),
          z = luminance(bg);
        const ratio = (Math.max(a, z) + 0.05) / (Math.min(a, z) + 0.05);
        const size = parseFloat(style.fontSize),
          weight = parseFloat(style.fontWeight);
        const target =
          size >= 24 || (size >= 18.666 && weight >= 700) ? 3 : 4.5;
        checked++;
        if (ratio < target)
          failures.push({
            text: el.textContent.trim().slice(0, 80),
            color: style.color,
            background: bg,
            ratio,
            target,
          });
      }
      return { checked, failures, skipped };
    }),
  });
}
await mkdir("test-results", { recursive: true });
await writeFile("test-results/contrast.json", JSON.stringify(runs, null, 2));
console.log(JSON.stringify(runs, null, 2));
await b.close();
