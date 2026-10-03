// Screenshots + checks via Chrome DevTools Protocol (no npm deps; Node 22+ global WebSocket).
// Usage: node tools/shoot.mjs [baseURL]   (serve the folder first: python3 -m http.server 8252)
// Checks: console errors, uncaught exceptions, failed requests, horizontal scroll, broken images.
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "shots"); mkdirSync(OUT, { recursive: true });
const BASE = process.argv[2] || "http://localhost:8252/";
const CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9334;
const chrome = spawn(CH, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-prefers-reduced-motion",
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "ags2-"))}`, "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let ws, id = 0; const pending = new Map();
const problems = [];
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

async function connect() {
  for (let t = 0; t < 50; t++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const page = list.find(p => p.type === "page");
      ws = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise(r => ws.addEventListener("open", r));
      ws.addEventListener("message", ev => {
        const m = JSON.parse(ev.data);
        if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return; }
        if (m.method === "Runtime.consoleAPICalled" && (m.params.type === "error" || m.params.type === "warning")) problems.push(`console.${m.params.type}: ${m.params.args.map(a => a.value ?? a.description).join(" ")}`);
        if (m.method === "Runtime.exceptionThrown") problems.push(`exception: ${m.params.exceptionDetails.text} ${m.params.exceptionDetails.exception?.description ?? ""}`);
        if (m.method === "Log.entryAdded" && m.params.entry.level === "error") problems.push(`log: ${m.params.entry.text} ${m.params.entry.url ?? ""}`);
        if (m.method === "Network.requestWillBeSent" && !m.params.request.url.startsWith(BASE) && !m.params.request.url.startsWith("data:")) problems.push(`off-origin request: ${m.params.request.url} from ${m.params.documentURL}`);
        if (m.method === "Network.loadingFailed") problems.push(`request failed: ${m.params.errorText} (${m.params.requestId})`);
        if (m.method === "Network.responseReceived" && m.params.response.status >= 400) problems.push(`HTTP ${m.params.response.status}: ${m.params.response.url}`);
      });
      return;
    } catch { await sleep(200); }
  }
  throw new Error("chrome did not start");
}

async function shot(name, width, height, mobile) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  await send("Page.navigate", { url: BASE });
  await sleep(2500);
  // scroll through so lazy images load, then back to top
  await send("Runtime.evaluate", { expression: `(async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){scrollTo(0,y);await new Promise(r=>setTimeout(r,70));}const y0=document.getElementById('yard');if(y0){y0.scrollLeft=y0.scrollWidth;await new Promise(r=>setTimeout(r,400));y0.scrollLeft=0;}scrollTo(0,0);})()`, awaitPromise: true });
  await sleep(1500);
  const fold = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(OUT, `${name}-fold.png`), Buffer.from(fold.data, "base64"));
  const check = await send("Runtime.evaluate", { expression: `JSON.stringify({
    hscroll: document.documentElement.scrollWidth > visualViewport.width || document.body.scrollWidth > visualViewport.width,
    sw: document.documentElement.scrollWidth, iw: innerWidth,
    broken: [...document.images].filter(i => i.getAttribute('src') && (!i.complete || i.naturalWidth === 0)).map(i => i.currentSrc || i.src),
    images: document.images.length,
    wide: [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > visualViewport.width + 1 && getComputedStyle(e).position !== 'fixed' && !e.closest('.yard') && !e.closest('.edge-tabs')).slice(0,20).map(e => e.tagName + '.' + e.className + ':' + Math.round(e.getBoundingClientRect().right)),
    vv: visualViewport.width, dw: document.documentElement.clientWidth, bw: document.body.scrollWidth,
  })`, returnByValue: true });
  const r = JSON.parse(check.result.value);
  console.log(name, JSON.stringify(r));
  if (r.hscroll) problems.push(`${name}: horizontal scroll (${r.sw} > ${r.iw}) ${r.wide.join(", ")}`);
  if (r.broken.length) problems.push(`${name}: broken images ${r.broken.join(", ")}`);
  const { cssContentSize } = await send("Page.getLayoutMetrics");
  const h = Math.ceil(cssContentSize.height);
  const full = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: h, scale: 1 } });
  writeFileSync(join(OUT, `${name}-full.png`), Buffer.from(full.data, "base64"));
  console.log(name, width + "x" + h);
}

await connect();
await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable"); await send("Network.enable");
await shot("desktop", 1440, 900, false);
await shot("phone", 390, 844, true);
ws.close(); chrome.kill();
console.log(problems.length ? "PROBLEMS:\n" + problems.join("\n") : "OK: no console errors, no failed requests, no horizontal scroll, all images loaded");
process.exit(problems.length ? 1 : 0);
