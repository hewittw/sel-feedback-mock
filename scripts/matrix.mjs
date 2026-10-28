// Screen-size matrix: screenshot one route at every common viewport, headless + logged-out.
// Usage: node scripts/matrix.mjs <url> <outPrefix>   e.g. node scripts/matrix.mjs http://localhost:3200/mood-boards/x screenshots/x
// Writes <outPrefix>-<name>.jpeg (full page) and prints overflow, console errors, broken images, and tiny text per size.
import { createRequire } from "module";
import fs from "fs";
import os from "os";
import path from "path";

const npx = path.join(os.homedir(), ".npm/_npx");
const pwDir = fs.readdirSync(npx).map((d) => path.join(npx, d, "node_modules")).find((d) => fs.existsSync(path.join(d, "playwright")));
const { chromium } = createRequire(path.join(pwDir, "/"))("playwright");
const cache = path.join(os.homedir(), "Library/Caches/ms-playwright");
const chromeDir = fs.readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().pop();
const exe = path.join(cache, chromeDir, "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");

const SIZES = [
  ["320-small-phone", 320, 640, true],
  ["375-iphone-se", 375, 667, true],
  ["390-iphone", 390, 844, true],
  ["430-iphone-max", 430, 932, true],
  ["844x390-phone-landscape", 844, 390, true],
  ["768-ipad-portrait", 768, 1024, true],
  ["1024-ipad-landscape", 1024, 768, true],
  ["1280-laptop", 1280, 800, false],
  ["1440-desktop", 1440, 900, false],
  ["1920-large", 1920, 1080, false],
  ["2560-ultrawide", 2560, 1440, false],
];
const [url, prefix] = process.argv.slice(2);
const b = await chromium.launch({ headless: true, executablePath: exe });
const rows = [];
for (const [name, w, h, touch] of SIZES) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch && w < 900 });
  const p = await ctx.newPage();
  const errs = [];
  p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 120)));
  p.on("pageerror", (e) => errs.push("pageerror: " + e.message.slice(0, 120)));
  await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += Math.max(400, h - 100)) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(100); }
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(1200);
  const r = await p.evaluate(() => {
    const vw = window.innerWidth;
    const overflow = document.documentElement.scrollWidth - vw;
    const offenders = [...document.querySelectorAll("body *")].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > vw + 1 && getComputedStyle(e).position !== "fixed"; })
      .slice(0, 5).map((e) => e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.split(" ")[0] : ""));
    const broken = [...document.images].filter((i) => !(i.complete && i.naturalWidth > 0)).length;
    // rendered size: SVG text is scaled by the SVG's screen transform, so multiply by it
    const rendered = (e) => { let f = parseFloat(getComputedStyle(e).fontSize); if (e instanceof SVGGraphicsElement && e.getScreenCTM) { const m = e.getScreenCTM(); if (m) f *= Math.hypot(m.a, m.b); } return f; };
    const tiny = [...document.querySelectorAll("body *")].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && e.getBoundingClientRect().width > 0 && rendered(e) < 10).length;
    return { overflow, offenders, broken, tiny };
  });
  const file = `${prefix}-${name}.jpeg`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await p.screenshot({ path: file, type: "jpeg", quality: 65, fullPage: true });
  rows.push({ size: name, overflowPx: r.overflow, overflowing: r.offenders, brokenImages: r.broken, textUnder10px: r.tiny, consoleErrors: errs.slice(0, 3), file });
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(rows, null, 1));
