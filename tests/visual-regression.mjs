// CI-only Chromium layout regression checks plus unapproved screenshot candidates.
// Requires only Node 22 and Chrome installed on a disposable GitHub Actions runner.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const url = new URL(process.env.VISUAL_TEST_URL ?? "http://127.0.0.1:3000/");
if (url.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(url.hostname)) {
  throw new Error("Visual checks must target only local HTTP.");
}
const output = path.resolve("visual-artifacts");
await mkdir(output, { recursive: true });
const dir = await mkdtemp(path.join(tmpdir(), "renivet-chrome-"));
const chrome = spawn(process.env.CHROME_BIN ?? "google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
  "--hide-scrollbars", "--no-first-run", "--no-default-browser-check",
  "--remote-debugging-port=0", "--user-data-dir=" + dir, "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
let stderr = "";
chrome.stderr.on("data", chunk => { stderr += String(chunk); });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws;
const pending = new Map();
let sequence = 0;
try {
  let port;
  for (let i = 0; i < 80; i++) {
    if (chrome.exitCode !== null) throw new Error("Chrome exited: " + stderr.slice(-900));
    try {
      const contents = await readFile(path.join(dir, "DevToolsActivePort"), "utf8");
      port = Number(contents.split("\n")[0]);
      if (port > 0) break;
    } catch {}
    await sleep(200);
  }
  if (!port) throw new Error("Chrome debugging unavailable: " + stderr.slice(-900));
  const sessions = await fetch("http://127.0.0.1:" + port + "/json/list").then(r => r.json());
  const session = sessions.find(item => item.type === "page");
  if (!session?.webSocketDebuggerUrl) throw new Error("Chrome page endpoint missing");
  ws = new WebSocket(session.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  ws.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (!pending.has(message.id)) return;
    const callback = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) callback.reject(new Error(JSON.stringify(message.error)));
    else callback.resolve(message.result);
  });
  function command(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (pending.delete(id)) reject(new Error("Chrome timeout: " + method));
      }, 15000).unref();
    });
  }
  await command("Page.enable");
  await command("Runtime.enable");
  const expression = '(' + function () {
    const main = document.querySelector("main");
    const h1 = document.querySelector("h1");
    if (document.readyState !== "complete" || !main || !h1) return null;
    const style = getComputedStyle(main), heading = getComputedStyle(h1);
    return {
      title: h1.textContent.trim(),
      width: Math.round(main.getBoundingClientRect().width),
      right: Math.round(main.getBoundingClientRect().right),
      height: Math.round(main.getBoundingClientRect().height),
      display: style.display, direction: style.flexDirection,
      fontSize: heading.fontSize, fontWeight: heading.fontWeight,
      background: getComputedStyle(document.body).backgroundColor,
      color: getComputedStyle(document.body).color,
      viewportWidth: innerWidth, viewportHeight: innerHeight,
      documentWidth: document.documentElement.scrollWidth
    };
  }.toString() + ')()';

  async function inspect(size, width, height, mobile) {
    await command("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
    await command("Page.navigate", { url: url.href });
    let m;
    for (let i = 0; i < 60; i++) {
      const response = await command("Runtime.evaluate", { expression, returnByValue: true });
      m = response.result?.value;
      if (m) break;
      await sleep(250);
    }
    assert.ok(m, size + ": page not ready");
    assert.equal(m.title, "New platform foundation");
    assert.equal(m.display, "flex", size + ": Tailwind flex not loaded");
    assert.equal(m.direction, "column", size + ": flex-column missing");
    assert.equal(m.fontSize, "36px", size + ": Tailwind text-4xl missing");
    assert.equal(m.fontWeight, "600", size + ": Tailwind semibold missing");
    assert.equal(m.background, "rgb(255, 255, 255)", size + ": background changed");
    assert.equal(m.color, "rgb(3, 20, 0)", size + ": forest token changed");
    assert.ok(m.documentWidth <= width, size + ": horizontal overflow");
    assert.ok(m.right <= width + 1, size + ": content overflows");
    assert.ok(m.height >= height - 1, size + ": min-h-screen missing");
    if (!mobile) assert.ok(m.width >= 700 && m.width <= 770, "max-w-3xl changed");
    const screenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
    const buffer = Buffer.from(screenshot.data, "base64");
    assert.equal(buffer.subarray(1, 4).toString(), "PNG");
    const filepath = path.join(output, "foundation-" + size + ".png");
    await writeFile(filepath, buffer);
    console.log("PASS " + size + " CSS/layout and screenshot: " + filepath, m);
  }
  await inspect("desktop", 1440, 900, false);
  await inspect("mobile", 390, 844, true);
} finally {
  for (const waiter of pending.values()) waiter.reject(new Error("Closing browser"));
  pending.clear();
  if (ws && ws.readyState === WebSocket.OPEN) ws.close();
  chrome.kill("SIGTERM");
  await sleep(100);
  await rm(dir, { recursive: true, force: true }).catch(() => {});
}
