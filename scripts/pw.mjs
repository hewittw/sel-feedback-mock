// Find a cached Playwright (no project dependency) whose Chromium, WebKit and Firefox are all installed.
// Install once if none is found: npx -y playwright@1.58 install chromium webkit firefox
import { createRequire } from "module";
import fs from "fs";
import os from "os";
import path from "path";

const npx = path.join(os.homedir(), ".npm/_npx");
const dirs = [process.env.PLAYWRIGHT_DIR, ...fs.readdirSync(npx).map((d) => path.join(npx, d, "node_modules"))]
  .filter((d) => d && fs.existsSync(path.join(d, "playwright")));
let pw;
for (const d of dirs) {
  const cand = createRequire(path.join(d, "/"))("playwright");
  if (["chromium", "webkit", "firefox"].every((e) => fs.existsSync(cand[e].executablePath()))) { pw = cand; break; }
}
if (!pw) throw new Error("No cached Playwright with all three browsers. Run: npx -y playwright@1.58 install chromium webkit firefox");
export const { chromium, webkit, firefox, devices } = pw;
