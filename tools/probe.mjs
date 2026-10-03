// One-off DOM probe at a given width: node tools/probe.mjs <width> "<js expression returning JSON-able>"
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const [width, expr] = [parseInt(process.argv[2] || "390"), process.argv[3] || "1"];
const PORT = 9335;
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-prefers-reduced-motion", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "ags2p-"))}`, "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
for (let t = 0; t < 50; t++) { try { const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); const page = list.find(p => p.type === "page"); ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r)); break; } catch { await sleep(200); } }
ws.addEventListener("message", ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 900 });
await send("Page.navigate", { url: "http://localhost:8252/" }); await sleep(2500);
const r = await send("Runtime.evaluate", { expression: `(async()=>JSON.stringify(await (${expr})))()`, awaitPromise: true, returnByValue: true });
console.log(r.result.value ?? JSON.stringify(r));
ws.close(); chrome.kill();
