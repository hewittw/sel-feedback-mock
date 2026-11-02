// End-to-end check of the whole session, the way a person uses it: start → question → rating → elaborate → next question → done.
// Runs in Chromium, WebKit (Safari) and Firefox × desktop, iPhone touch, reduced motion, and JavaScript OFF.
// Then checks refresh, Back and Forward, and that every URL (5 modes × home + 5 steps) loads on its own.
// Usage: node scripts/flow.mjs [baseUrl]   (default http://localhost:3456). Exits 1 on any failure.
import { chromium, webkit, firefox, devices } from "./pw.mjs";

const BASE = (process.argv[2] ?? "http://localhost:3456").replace(/\/$/, "");
const MODES = ["none", "positive", "tangential", "too-hard", "too-personal"];
const CONFIGS = [
  ["desktop", { viewport: { width: 1440, height: 900 } }],
  ["iphone-touch", { ...devices["iPhone 13"] }],
  ["reduced-motion", { viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" }],
  ["no-js", { viewport: { width: 1280, height: 800 }, javaScriptEnabled: false }],
];
let failed = 0;

// Vercel's automatic DDoS mitigation challenges an IP that sends a burst of automated traffic (~2k requests/hour
// from repeated runs). That is the firewall, not the site: stop and say so instead of reporting 13 confusing failures.
const probe = await fetch(`${BASE}/`);
if (probe.headers.get("x-vercel-mitigated") === "challenge") {
  console.log("✕ Vercel's firewall is challenging this IP (x-vercel-mitigated: challenge) after a burst of test traffic.\n  Not a site bug. Wait until it lifts (`vercel firewall overview`), and run against localhost meanwhile.");
  process.exit(2);
}
const log = (ok, msg) => { if (!ok) failed++; console.log(`${ok ? "✓" : "✕"} ${msg}`); };

for (const [ename, eng] of Object.entries({ chromium, webkit, firefox })) {
  const b = await eng.launch();
  for (const [cname, base] of CONFIGS) {
    const opts = { ...base };
    if (ename === "firefox") delete opts.isMobile; // Firefox has no mobile emulation
    const ctx = await b.newContext(opts);
    const p = await ctx.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push("pageerror: " + e.message.slice(0, 100)));
    p.on("console", (m) => m.type() === "error" && opts.javaScriptEnabled !== false && errs.push("console: " + m.text().slice(0, 100)));
    p.on("response", (r) => r.status() >= 400 && errs.push(`http ${r.status()} ${r.url().slice(-60)}`));
    const press = async (name) => {
      // Let the card's slide-in finish first: with JS off, Playwright never sees a moving target as stable.
      await p.waitForTimeout(350);
      const l = p.getByRole("button", { name }).or(p.getByRole("link", { name })).first();
      await (opts.hasTouch ? l.tap({ timeout: 5000 }) : l.click({ timeout: 5000 }));
    };
    const see = async (text) => { await p.getByText(text).first().waitFor({ state: "visible", timeout: 6000 }); };
    let reached = "home";
    try {
      await p.goto(`${BASE}/?mode=tangential`, { waitUntil: "networkidle" });
      await press("Start interaction"); await see("Question 1"); reached = "1 question";
      await press("Done talking"); await see("How did that question go?"); reached = "2 rating";
      await press("Not great"); await see("Parent, elaborate on your previous response."); reached = "3 elaborate";
      if (!(await p.getByText("You picked").isVisible())) throw new Error("picked face not shown on elaborate card");
      await p.locator("button[type=submit]:not([disabled])").waitFor({ timeout: 8000 }); // enabled once the sample answer finishes typing
      const typed = await p.locator("textarea").inputValue();
      if (!typed.includes("tangential")) throw new Error(`feedback box holds "${typed}"`);
      await press("Send feedback →"); await see("Originally planned"); reached = "4 next question";
      if (!(await p.getByText("We ended up talking about homework").isVisible())) throw new Error("sent feedback not shown");
      if (!(await p.locator(".fb-rating").textContent()).includes("Not great")) throw new Error("rating not shown");
      const deco = await p.locator(".q-old .q-text").evaluate((e) => getComputedStyle(e).textDecorationLine).catch(() => "none");
      if (deco.includes("line-through")) throw new Error("originally planned question is struck through");
      await p.goBack(); await see("Parent, elaborate on your previous response."); reached = "3 after Back";
      await p.goForward(); await see("Originally planned"); reached = "4 after Forward";
      // Refresh last: Playwright's Firefox reload with JS off adds a history entry, which a real reload doesn't.
      await p.reload(); await see("Originally planned"); reached = "4 after refresh";
      await press("Ask this question"); await see("That’s the full loop."); reached = "5 done";
    } catch (e) { errs.push("stopped: " + e.message.split("\n")[0].slice(0, 110)); }
    log(reached === "5 done" && errs.length === 0, `${ename.padEnd(8)} ${cname.padEnd(14)} reached ${reached}${errs.length ? " · " + errs.join(" | ") : ""}`);
    await ctx.close();
  }
  await b.close();
}

// Every step URL loads on its own, with no client JavaScript involved.
const want = ["Read, talk, check in.", "Question 1", "How did that question go?", "Parent, elaborate on your previous response.", "Originally planned", "That’s the full loop."];
let bad = [];
for (const m of MODES) for (let s = 0; s < want.length; s++) {
  const url = `${BASE}/?mode=${m}${s ? `&step=${s}` : ""}`;
  const r = await fetch(url);
  const html = await r.text();
  if (r.status !== 200 || !html.includes(want[s])) bad.push(`${r.status} ${url}`);
}
log(bad.length === 0, `all ${MODES.length * want.length} step URLs return 200 with their card in the server HTML${bad.length ? " · " + bad.join(", ") : ""}`);

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
