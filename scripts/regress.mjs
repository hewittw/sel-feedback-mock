// Regression checks for bugs an independent verifier found (2026-10-28). Usage: node scripts/regress.mjs [baseUrl]
import { chromium, webkit, firefox } from "./pw.mjs";
const BASE = (process.argv[2] ?? "http://localhost:3456").replace(/\/$/, "");
let failed = 0;
const log = (ok, msg) => { if (!ok) failed++; console.log(`${ok ? "✓" : "✕"} ${msg}`); };
const submit = (p) => p.locator("button[type=submit]:not([disabled])").click();

for (const [name, eng] of Object.entries({ chromium, webkit, firefox })) {
  const b = await eng.launch();
  try {
    // 1. Typing before hydration must survive hydration.
    let ctx = await b.newContext(); let p = await ctx.newPage();
    await p.route(/\/_next\/static\/.*\.js/, async (r) => { await new Promise((z) => setTimeout(z, 3000)); await r.continue(); });
    await p.goto(`${BASE}/?mode=positive&step=2`, { waitUntil: "commit" });
    await p.locator("textarea").fill("typed early");
    await p.waitForLoadState("networkidle"); await p.waitForTimeout(800);
    const v1 = await p.locator("textarea").inputValue();
    await submit(p); await p.getByText("Originally planned").waitFor();
    const shown = await p.locator(".why dd").first().textContent();
    log(v1 === "typed early" && shown.includes("typed early"), `${name}: early typing survives hydration (box "${v1}", Q2 "${shown}")`);
    await ctx.close();

  } catch (e) { log(false, `${name}: ${e.message.split("\n")[0]}`); }
  try {
    let ctx, p;
    // 2. Browser Back from Question 2 keeps the edited feedback.
    ctx = await b.newContext(); p = await ctx.newPage();
    await p.goto(`${BASE}/?mode=positive&step=1`, { waitUntil: "networkidle" });
    await p.getByRole("link", { name: "Done talking" }).click();
    await p.getByText("Time to give feedback.").waitFor();
    await p.locator("button[type=submit]:not([disabled])").waitFor(); // sample finished typing
    await p.locator("textarea").fill("my own words"); await submit(p); await p.getByText("Originally planned").waitFor();
    await p.goBack(); await p.getByText("Time to give feedback.").waitFor(); await p.waitForTimeout(1200);
    const v2 = await p.locator("textarea").inputValue();
    log(v2 === "my own words", `${name}: browser Back keeps edited feedback ("${v2}")`);
    await ctx.close();

  } catch (e) { log(false, `${name} #2: ${e.message.split("\n")[0]}`); }
  try {
    let ctx, p;
    // 3. Whitespace-only feedback reads as none.
    ctx = await b.newContext(); p = await ctx.newPage();
    await p.goto(`${BASE}/?mode=positive&step=3&fb=%20%20%20`, { waitUntil: "networkidle" });
    const d3 = (await p.locator(".why dd").first().textContent()).trim();
    log(d3 === "None given", `${name}: whitespace feedback shows "None given" ("${d3}")`);
    await ctx.close();

  } catch (e) { log(false, `${name} #3: ${e.message.split("\n")[0]}`); }
  try {
    let ctx, p;
    // 4. A stalled step request falls back to a normal page load.
    ctx = await b.newContext(); p = await ctx.newPage();
    await p.goto(`${BASE}/?mode=positive`, { waitUntil: "networkidle" });
    await p.route(/_rsc=/, () => {}); // never answer
    const t = Date.now();
    await p.getByRole("button", { name: "Start interaction" }).click();
    await p.getByText("Question 1").waitFor({ timeout: 15000 }).catch(() => {});
    const ok4 = await p.getByText("Question 1").isVisible();
    log(ok4, `${name}: stalled step request recovers by full load (${ok4 ? Date.now() - t + "ms" : "stuck"})`);
    await ctx.close();
  } catch (e) { log(false, `${name}: ${e.message.split("\n")[0]}`); }
  await b.close();
}
console.log(failed ? `\n${failed} failed` : "\nAll regression checks passed");
process.exit(failed ? 1 : 0);
