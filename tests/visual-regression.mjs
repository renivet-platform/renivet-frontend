/* global URL, process, setTimeout, fetch, WebSocket, document, getComputedStyle, innerWidth, innerHeight, Buffer, console */
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
const chromeEnv = {
  ...process.env,
  DBUS_SESSION_BUS_ADDRESS: "unix:path=/dev/null",
  DBUS_SYSTEM_BUS_ADDRESS: "unix:path=/dev/null",
  XDG_RUNTIME_DIR: "",
};
const chrome = spawn(process.env.CHROME_BIN ?? "google-chrome", [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
  "--hide-scrollbars", "--no-first-run", "--no-default-browser-check",
  "--remote-debugging-port=0", "--user-data-dir=" + dir, "about:blank",
], { stdio: ["ignore", "ignore", "pipe"], env: chromeEnv });
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
    } catch { /* Chrome has not created the debugging port file yet. */ }
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
    const main = document.querySelector('[aria-labelledby="storefront-title"]');
    const h1 = document.querySelector("h1");
    if (document.readyState !== "complete" || !main || !h1) return null;
    const style = getComputedStyle(main), heading = getComputedStyle(h1);
    return {
      title: h1.textContent.trim(),
      width: Math.round(main.getBoundingClientRect().width),
      right: Math.round(main.getBoundingClientRect().right),
      height: Math.round(main.getBoundingClientRect().height),
      display: style.display, columns: style.gridTemplateColumns,
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
    assert.equal(m.title, "Made by hand, with the proof to show for it.");
    assert.equal(m.display, "grid", size + ": approved responsive hero layout changed");
    if (mobile) assert.equal(m.columns.split(" ").length, 1, size + ": mobile hero must stack");
    assert.equal(m.fontSize, mobile ? "40px" : "58px", size + ": approved storefront heading scale changed");
    assert.equal(m.fontWeight, "500", size + ": approved heading weight changed");
    assert.equal(m.background, "rgb(246, 244, 239)", size + ": approved canvas token changed");
    assert.equal(m.color, "rgb(27, 36, 32)", size + ": approved ink token changed");
    assert.ok(m.documentWidth <= width, size + ": horizontal overflow");
    assert.ok(m.right <= width + 1, size + ": content overflows");
    assert.ok(m.height > 0, size + ": hero content is not rendered");
    if (!mobile) assert.equal(m.width, 1176, "desktop storefront hero width changed");
    const screenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
    const buffer = Buffer.from(screenshot.data, "base64");
    assert.equal(buffer.subarray(1, 4).toString(), "PNG");
    const filepath = path.join(output, "foundation-" + size + ".png");
    await writeFile(filepath, buffer);
    console.log("PASS " + size + " CSS/layout and screenshot: " + filepath, m);
  }

  async function inspectAdmin(size, width, height, mobile) {
    const adminScreens = [
      ["/operations/sign-in", "AD-01", "Sign in to Renivet"],
      ["/operations", "AD-02", null],
      ["/brand-approvals", "AD-03", null],
      ["/brand-approvals/11111111-1111-4111-8111-111111111111", "AD-04", null],
      ["/operations/bank", "AD-05", "Bank verification", true],
      ["/operations/staff", "AD-06", "Staff and access", true],
      ["/taxonomy", "AD-07", null],
      ["/operations/quality", "AD-08A", null],
      ["/operations/quality/22222222-2222-4222-8222-222222222222", "AD-08B", null],
      ["/operations/exceptions", "AD-09", "Inventory exceptions", true],
      ["/operations/privacy", "AD-19", "Privacy requests", true],
      ["/operations/audit", "AD-20", "Audit log", true],
    ];
    await command("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
    for (const [route, id, title, requiresUnavailable] of adminScreens) {
      await command("Page.navigate", { url: new URL(route, url).href });
      let state;
      const expression = "(() => { const main = document.querySelector('[data-screen-id]'); const h1 = main?.querySelector('h1') ?? document.querySelector('h1'); return document.readyState === 'complete' && main && h1 ? { id: main.dataset.screenId, title: h1.textContent.trim(), status: main.innerText.includes('Not connected'), width: document.documentElement.scrollWidth, viewport: innerWidth, height: main.getBoundingClientRect().height } : null; })()";
      for (let i = 0; i < 60; i++) {
        const response = await command("Runtime.evaluate", { expression, returnByValue: true });
        state = response.result?.value;
        if (state) break;
        await sleep(200);
      }
      assert.ok(state, size + " " + route + ": page not ready");
      assert.equal(state.id, id, size + " " + route + ": wrong screen ID");
      assert.ok(state.title.length > 0, size + " " + route + ": page title is missing");
      if (title) assert.equal(state.title, title, size + " " + route + ": wrong page title");
      if (requiresUnavailable) assert.equal(state.status, true, size + " " + route + ": unavailable service state is not clear");
      assert.ok(state.width <= width, size + " " + route + ": horizontal overflow");
      assert.ok(state.height > 0, size + " " + route + ": page content is not rendered");
      const screenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
      const buffer = Buffer.from(screenshot.data, "base64");
      assert.equal(buffer.subarray(1, 4).toString(), "PNG");
      const filepath = path.join(output, "admin-" + id + "-" + size + ".png");
      await writeFile(filepath, buffer);
      console.log("PASS " + size + " " + id + " admin screen: " + filepath, state);
    }
  }

  // REN2-117 CU-21A/B: real route screenshots and safety checks while the
  // consent/privacy API is contract-pending. No fake saved requests permitted.
  async function inspectPrivacy(size, width, height, mobile) {
    await command("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
    for (const [route, id, heading] of [
      ["/privacy", "CU-21A", "Privacy & communication"],
      ["/privacy/requests", "CU-21B", "Data requests"],
    ]) {
      await command("Page.navigate", { url: new URL(route, url).href });
      const expression = "(() => { const root=document.querySelector('[data-screen-id]'); const h1=root?.querySelector('h1'); return document.readyState==='complete' && root && h1 ? { id:root.dataset.screenId, title:h1.textContent.trim(), width:document.documentElement.scrollWidth, text:root.innerText } : null })()";
      let state;
      for (let i=0; i<60; i++) {
        const response = await command("Runtime.evaluate", { expression, returnByValue:true });
        state = response.result?.value;
        if (state) break;
        await sleep(150);
      }
      assert.ok(state, size + " " + route + ": privacy page not ready");
      assert.equal(state.id, id, size + " " + route + ": wrong prototype screen ID");
      assert.equal(state.title, heading, size + " " + route + ": wrong prototype heading");
      assert.ok(state.width <= width, size + " " + route + ": horizontal overflow");
      assert.ok(state.text.includes("not connected"), size + " " + route + ": missing pending-contract disclosure");
      if (id === "CU-21A") {
        const pending = await command("Runtime.evaluate", { expression:"[...document.querySelectorAll('input[type=checkbox]')].every(input => input.disabled && !input.checked)",returnByValue:true });
        assert.equal(pending.result?.value,true,"marketing preferences cannot be submitted without an approved API");
      }
      const screenshot = await command("Page.captureScreenshot", { format:"png", fromSurface:true });
      const bytes = Buffer.from(screenshot.data,"base64");
      assert.equal(bytes.subarray(1,4).toString(),"PNG");
      const pathname=path.join(output,"privacy-"+id+"-"+size+".png");
      await writeFile(pathname,bytes);
      console.log("PASS "+size+" "+id+" privacy state / responsive layout: "+pathname);
    }
  }

  await inspect("desktop", 1440, 900, false);
  await inspect("mobile", 390, 844, true);
  await inspectAdmin("desktop", 1280, 900, false);
  await inspectAdmin("mobile", 390, 844, true);
  await inspectPrivacy("desktop", 1280, 900, false);
  await inspectPrivacy("mobile", 390, 844, true);
} finally {
  for (const waiter of pending.values()) waiter.reject(new Error("Closing browser"));
  pending.clear();
  if (ws && ws.readyState === WebSocket.OPEN) ws.close();
  chrome.kill("SIGTERM");
  await sleep(100);
  await rm(dir, { recursive: true, force: true }).catch(() => {});
}
