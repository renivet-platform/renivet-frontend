/* global process, setTimeout, fetch, WebSocket, URL, console, Buffer */
// Browser-level checks for the account UI; run against the disposable CI Next.js server.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { once } from "node:events";
import { tmpdir } from "node:os";
import path from "node:path";

const base = new URL(process.env.AUTH_TEST_BASE_URL ?? "http://localhost:3000/");
if (base.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(base.hostname)) throw new Error("Auth UI checks must use local HTTP only.");
const dir = await mkdtemp(path.join(tmpdir(), "renivet-auth-chrome-"));
const challengeId = "37a7d0bf-8414-4f75-bd11-311c7a442d84";
const csrfToken = "synthetic-csrf-token-012345678901234567890123";
const testPhone = "+919876543210";
let attachedPhone = false;
let phoneChallengeRequested = false;
let phoneChallengeVerified = false;
let phoneLoginChallengeRequested = false;
let phoneLoginVerified = false;
let phoneRegistrationChallengeRequested = false;
let phoneRegistrationVerified = false;
let currentSignInMethod = "phone";
let currentPhoneVerified = true;
let currentDestination = { kind: "storefront" };
let logoutRequests = 0;
const emailChallengeRequests = [];
const mockApi = createServer(async (request, response) => {
  let raw = ""; for await (const chunk of request) raw += chunk.toString();
  const body = raw ? JSON.parse(raw) : {};
  const send = (status, data, headers = {}) => { response.writeHead(status, { "Content-Type": "application/json", ...headers }); response.end(JSON.stringify(data)); };
  if (request.url === "/api/v1/auth/register" && request.method === "POST") return send(202, { status: "accepted" });
  if (request.url === "/api/v1/auth/phone" && request.method === "POST") {
    if (!request.headers.cookie?.includes("__Host-renivet_session=synthetic-session") || request.headers["x-csrf-token"] !== csrfToken
      || request.headers.origin !== base.origin || request.headers["sec-fetch-site"] !== "same-origin" || body.phone !== testPhone) {
      return send(403, { code: "CSRF_VALIDATION_FAILED", message: "private CSRF detail" });
    }
    attachedPhone = true;
    return send(202, { status: "accepted", verificationRequired: true });
  }
  if (request.url === "/api/v1/auth/challenges" && request.method === "POST") {
    if (body.destination === "outage@example.test") return send(503, { code: "AUTH_SERVICE_UNAVAILABLE", message: "provider offline" });
    if (body.channel === "email") emailChallengeRequests.push(body);
    if (body.channel === "phone" && body.purpose === "phone_verification" && body.destination === testPhone) phoneChallengeRequested = true;
    if (body.channel === "phone" && body.purpose === "phone_login" && body.destination === testPhone) phoneLoginChallengeRequested = true;
    if (body.channel === "phone" && body.purpose === "phone_registration" && body.destination === testPhone) phoneRegistrationChallengeRequested = true;
    return send(202, { status: "accepted", challengeId });
  }
  if (request.url === `/api/v1/auth/challenges/${challengeId}/verify` && request.method === "POST") {
    if (body.code !== "123456") return send(401, { code: "AUTHENTICATION_FAILED", message: "private delivery state" });
    if (body.purpose === "phone_verification") { phoneChallengeVerified = true; currentPhoneVerified = true; }
    if (body.purpose === "phone_login") {
      if (body.code !== "123456" || !phoneLoginChallengeRequested) return send(401, { code: "AUTHENTICATION_FAILED", message: "private login detail" });
      phoneLoginVerified = true;
      currentSignInMethod = "phone"; currentPhoneVerified = true;
      return send(200, { authenticationState: "authenticated", user: { id: "37a7d0bf-8414-4f75-bd11-311c7a442d84" } }, {
        "Set-Cookie": "__Host-renivet_session=synthetic-session; Path=/; Max-Age=1800; HttpOnly; Secure; SameSite=Lax",
      });
    }
    if (body.purpose === "phone_registration") {
      if (!phoneRegistrationChallengeRequested) return send(401, { code: "AUTHENTICATION_FAILED", message: "private registration detail" });
      phoneRegistrationVerified = true;
      currentSignInMethod = "phone"; currentPhoneVerified = true;
      return send(200, { authenticationState: "authenticated", user: { id: "37a7d0bf-8414-4f75-bd11-311c7a442d84" } }, {
        "Set-Cookie": "__Host-renivet_session=synthetic-session; Path=/; Max-Age=1800; HttpOnly; Secure; SameSite=Lax",
      });
    }
    return send(200, { status: "verified" });
  }
  if (request.url === "/api/v1/auth/sessions" && request.method === "POST") {
    if (body.email === "unknown@example.test") return send(401, { code: "AUTHENTICATION_FAILED", message: "email enumeration detail" });
    currentSignInMethod = "email_password"; currentPhoneVerified = false;
    currentDestination = body.email === "admin@example.test" ? { kind: "operations" }
      : body.email === "seller@example.test" ? { kind: "brands", brands: [{ id: "2a6b7c8d-1111-4111-8111-123456789abc", name: "Approved brand" }] }
        : body.email === "multi-seller@example.test" ? { kind: "brands", brands: [
          { id: "2a6b7c8d-1111-4111-8111-123456789abc", name: "Approved brand" },
          { id: "3b7c8d9e-2222-4222-8222-234567890abc", name: "Second approved brand" },
        ] } : { kind: "storefront" };
    return send(200, { authenticationState: "authenticated", user: { id: "37a7d0bf-8414-4f75-bd11-311c7a442d84" } }, {
      "Set-Cookie": "__Host-renivet_session=synthetic-session; Path=/; Max-Age=1800; HttpOnly; Secure; SameSite=Lax",
    });
  }
  if (request.url === "/api/v1/auth/session" && request.method === "GET") {
    return request.headers.cookie?.includes("__Host-renivet_session=synthetic-session")
      ? send(200, { authenticationState: "authenticated", user: { id: "37a7d0bf-8414-4f75-bd11-311c7a442d84" }, account: { signInMethod: currentSignInMethod, phoneVerified: currentPhoneVerified }, destination: currentDestination, csrfToken })
      : send(401, { code: "AUTHENTICATION_FAILED", message: "no session" });
  }
  if (request.url === "/api/v1/auth/session" && request.method === "DELETE") {
    if (request.headers["x-csrf-token"] !== csrfToken) return send(403, { code: "CSRF_VALIDATION_FAILED", message: "invalid proof" });
    logoutRequests += 1;
    return send(200, { status: "logged_out" }, { "Set-Cookie": "__Host-renivet_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax" });
  }
  return send(404, { code: "AUTH_INPUT_INVALID", message: "not found" });
});
mockApi.listen(Number(process.env.AUTH_MOCK_API_PORT ?? 4000), "127.0.0.1");
await once(mockApi, "listening");
const chromeEnv = {
  ...process.env,
  DBUS_SESSION_BUS_ADDRESS: "unix:path=/dev/null",
  DBUS_SYSTEM_BUS_ADDRESS: "unix:path=/dev/null",
  XDG_RUNTIME_DIR: "",
};
const chrome = spawn(process.env.CHROME_BIN ?? "google-chrome", ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", "--user-data-dir=" + dir, "about:blank"], { stdio: ["ignore", "ignore", "pipe"], env: chromeEnv });
let stderr = ""; chrome.stderr.on("data", chunk => { stderr += String(chunk); });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws; const pending = new Map(); let sequence = 0;
try {
  let port;
  for (let i = 0; i < 80; i++) {
    if (chrome.exitCode !== null) throw new Error("Chrome exited: " + stderr.slice(-800));
    try { port = Number((await readFile(path.join(dir, "DevToolsActivePort"), "utf8")).split("\n")[0]); if (port > 0) break; } catch { /* Chrome may still be starting. */ }
    await sleep(200);
  }
  assert.ok(port, "Chrome debugging endpoint started");
  const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
  ws = new WebSocket(pages.find(item => item.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  ws.addEventListener("message", event => { const message = JSON.parse(event.data); const waiter = pending.get(message.id); if (!waiter) return; pending.delete(message.id); if (message.error) waiter.reject(new Error(JSON.stringify(message.error))); else waiter.resolve(message.result); });
  const command = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); setTimeout(() => { if (pending.delete(id)) reject(new Error("Chrome timeout: " + method)); }, 12000).unref(); });
  await command("Page.enable"); await command("Runtime.enable");
  const evaluate = async expression => (await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.value;
  const waitFor = async expression => { for (let i = 0; i < 80; i++) { const value = await evaluate(expression); if (value) return value; await sleep(100); } throw new Error("Timed out waiting for browser condition: " + expression + "\nPage: " + await evaluate("document.body.innerText")); };
  const waitInteractive = id => waitFor(`(() => { const input=document.getElementById(${JSON.stringify(id)}); return !!input && Object.keys(input).some(key => key.startsWith('__reactProps')) })()`);
  const enter = async (id, value) => evaluate(`(() => { const input=document.getElementById(${JSON.stringify(id)}); const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(input,${JSON.stringify(value)}); input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true})); return true })()`);
  const submit = () => evaluate("document.querySelector('form').requestSubmit(); true");
  for (const [route, title, fields] of [
    ["sign-in", "Sign in to Renivet", ["Email address", "Password"]],
    ["register", "Create your account", ["Email address", "Create password"]],
    ["recover", "Reset your password", ["Email address"]],
  ]) {
    for (const width of [320, 390]) {
      await command("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 1, mobile: true });
      await command("Page.navigate", { url: new URL(route, base).href });
      if (route === "register") {
        await waitFor("[...document.querySelectorAll('button')].some(button => button.textContent.includes('Email and password'))");
        await evaluate("[...document.querySelectorAll('button')].find(button => button.textContent.includes('Email and password'))?.click()");
      }
      const page = await waitFor(`(() => {
        const main = document.querySelector('main');
        const heading = document.querySelector('h1');
        const labels = [...document.querySelectorAll('label')].map(label => label.textContent.trim());
        return main && heading && ${JSON.stringify(fields)}.every(field => labels.includes(field))
          ? { title: heading.textContent.trim(), labels, width: document.documentElement.scrollWidth,
              viewport: innerWidth, button: !!document.querySelector('button[type=submit]') }
          : null;
      })()`);
      assert.equal(page.title, title, `${route}: expected screen heading`);
      assert.ok(fields.every(field => page.labels.includes(field)), `${route}: all fields have visible labels`);
      assert.ok(page.button, `${route}: submit action exists`);
      assert.ok(page.width <= width, `${route}: no horizontal overflow at ${width}px`);
      await evaluate("document.querySelector('a')?.focus()");
      await command("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
      await command("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
      assert.equal(await evaluate("document.activeElement?.matches(':focus-visible')"), true, `${route}: keyboard focus is visible`);
    }
    console.log(`PASS /${route}: heading, labels, submit control, 320/390px width, keyboard focus`);
  }
  await command("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await command("Page.navigate", { url: new URL("register", base).href });
  await sleep(500);
  const wide = await command("Runtime.evaluate", { expression: "document.documentElement.scrollWidth <= innerWidth", returnByValue: true });
  assert.equal(wide.result.value, true, "registration screen has no desktop horizontal overflow");
  await mkdir("visual-artifacts", { recursive: true });
  const desktopShot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
  await writeFile(path.join("visual-artifacts", "auth-register-desktop.png"), Buffer.from(desktopShot.data, "base64"));
  await command("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await command("Page.navigate", { url: new URL("register", base).href }); await waitFor("document.getElementById('register-phone') !== null");
  const mobileShot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
  await writeFile(path.join("visual-artifacts", "auth-register-mobile.png"), Buffer.from(mobileShot.data, "base64"));
  console.log("PASS /register: desktop width");

  // Phone-only registration -> purpose-bound OTP -> signed-in session.
  await command("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await command("Page.navigate", { url: new URL("register", base).href });
  await waitInteractive("register-phone");
  assert.equal(await evaluate("document.getElementById('register-password') === null"), true, "phone-only signup does not ask the user for a password");
  await enter("register-phone", testPhone); await submit(); await waitInteractive("register-code");
  assert.equal(await evaluate("document.activeElement?.id === 'register-code'"), true, "phone registration focuses the OTP input after requesting a challenge");
  await enter("register-code", "123456"); await submit();
  await waitFor("location.pathname === '/account' && document.body.innerText.includes('You are signed in')");
  assert.equal(phoneRegistrationChallengeRequested && phoneRegistrationVerified, true, "signup sends phone_registration and verifies that same purpose");
  assert.equal(await evaluate("document.getElementById('account-phone') === null && document.body.innerText.includes('Your phone number is verified')"), true, "phone-only account does not ask the user to verify the sign-in phone a second time");
  assert.equal(await evaluate("document.cookie.includes('synthetic-session') === false && location.search === ''"), true, "phone registration keeps session proof HttpOnly and credentials out of URL");
  console.log("PASS phone-only registration -> OTP verification -> new authenticated session");
  await evaluate("[...document.querySelectorAll('button')].find(button => button.textContent.includes('Sign out'))?.click()");
  await waitFor("location.pathname === '/sign-in'");
  assert.equal(logoutRequests, 1, "phone-only sign out reaches server revocation before redirecting");

  // Registration -> email challenge -> code verification -> password login -> session -> CSRF logout.
  await command("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await command("Page.navigate", { url: new URL("register", base).href });
  await waitFor("[...document.querySelectorAll('button')].some(button => button.textContent.includes('Email and password'))");
  await evaluate("[...document.querySelectorAll('button')].find(button => button.textContent.includes('Email and password'))?.click()");
  await waitInteractive("register-email");
  await enter("register-email", "buyer@example.test"); await enter("register-password", "pass1234"); await submit();
  await waitInteractive("register-code");
  assert.equal(await evaluate("document.activeElement?.id === 'register-code'"), true, "registration focuses the code field when the challenge step opens");
  const registerRequestsBeforeResend = emailChallengeRequests.length;
  await evaluate("[...document.querySelectorAll('button')].find(button => button.textContent.includes('Resend code'))?.click()");
  await waitFor("document.getElementById('register-code')?.value === ''");
  await sleep(250);
  assert.equal(emailChallengeRequests.length, registerRequestsBeforeResend + 1, "registration resend requests a new email verification challenge");
  assert.equal(emailChallengeRequests.at(-1)?.purpose, "email_verification", "registration resend keeps the email-verification purpose");
  await enter("register-code", "123456"); await submit();
  await waitFor("document.body.innerText.includes('Your email is verified')");
  assert.equal(await evaluate("location.search === '' && document.cookie.includes('synthetic-session') === false"), true, "verification keeps challenge/code/session out of URL and document.cookie");
  await command("Page.navigate", { url: new URL("sign-in", base).href });
  await waitInteractive("signin-email");
  await enter("signin-email", "buyer@example.test"); await enter("signin-password", "pass1234"); await submit();
  await waitFor("location.pathname === '/account' && document.body.innerText.includes('You are signed in')");
  assert.equal(await evaluate("document.getElementById('account-phone') !== null"), true, "email/password account can add an optional verified contact phone");
  assert.equal(await evaluate("document.cookie.includes('synthetic-session')"), false, "HttpOnly session cookie is not readable by page JavaScript");
  assert.equal(await evaluate("location.search === ''"), true, "session proof is absent from the URL");
  await waitInteractive("account-phone");
  await enter("account-phone", testPhone); await submit();
  await waitInteractive("account-phone-code");
  await enter("account-phone-code", "123456"); await submit();
  await waitFor("document.body.innerText.includes('Your phone number is verified for this account')");
  assert.equal(await evaluate("location.search === '' && document.cookie.includes('synthetic-session') === false"), true, "phone number, OTP, and session secret stay out of URL and document.cookie");
  assert.equal(attachedPhone && phoneChallengeRequested && phoneChallengeVerified, true, "browser flow calls attach, request-code, and verify-code backend operations in order");
  await command("Emulation.setDeviceMetricsOverride", { width: 320, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true, "phone verification account page has no horizontal overflow at 320px");
  await command("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  console.log("PASS signed-in phone attach -> phone OTP request -> code verification through same-origin BFF");
  await evaluate("[...document.querySelectorAll('button')].find(button => button.textContent.includes('Sign out'))?.click()");
  await waitFor("location.pathname === '/sign-in'");
  await command("Page.navigate", { url: new URL("account", base).href });
  await waitFor("document.body.innerText.includes('Your session has expired')");
  console.log("PASS registration, email verification, secure session cookie, session inspection, logout, expired-session flow");

  await command("Page.navigate", { url: new URL("sign-in", base).href }); await waitInteractive("signin-email");
  await enter("signin-email", "unknown@example.test"); await enter("signin-password", "pass1234"); await submit();
  await waitFor("document.body.innerText.includes('We couldn’t sign you in with those details.')");
  assert.equal(await evaluate("!document.body.innerText.includes('enumeration detail')"), true, "login failure does not expose backend detail");
  await command("Page.navigate", { url: new URL("recover", base).href }); await waitInteractive("recovery-email");
  await enter("recovery-email", "buyer@example.test"); await submit(); await waitInteractive("recovery-code");
  assert.equal(await evaluate("document.activeElement?.id === 'recovery-code'"), true, "recovery focuses the code field when the challenge step opens");
  const recoveryRequestsBeforeResend = emailChallengeRequests.length;
  await enter("recovery-code", "111111");
  await evaluate("[...document.querySelectorAll('button')].find(button => button.textContent.includes('Resend code'))?.click()");
  await waitFor("document.getElementById('recovery-code')?.value === ''");
  await sleep(250);
  assert.equal(emailChallengeRequests.length, recoveryRequestsBeforeResend + 1, "recovery resend requests a new challenge");
  assert.equal(emailChallengeRequests.at(-1)?.purpose, "password_recovery", "recovery resend keeps the password-recovery purpose");
  await enter("recovery-code", "000000"); await enter("recovery-password", "another synthetic password"); await submit();
  await waitFor("document.body.innerText.includes('We couldn’t sign you in with those details')");
  assert.equal(await evaluate("!document.body.innerText.includes('private delivery state')"), true, "OTP denial hides backend details");
  assert.equal(await evaluate("document.getElementById('recovery-code')?.getAttribute('aria-invalid') === 'true' && document.getElementById('recovery-code')?.getAttribute('aria-describedby') === document.querySelector('[role=alert]')?.id"), true, "recovery code error is announced and associated with its input");
  await enter("recovery-code", "123456"); await submit();
  await waitFor("document.body.innerText.includes('your password has been reset')");
  assert.equal(await evaluate("location.search === ''"), true, "recovery code and password do not enter the URL");
  await command("Page.navigate", { url: new URL("recover", base).href }); await waitInteractive("recovery-email");
  await enter("recovery-email", "outage@example.test"); await submit();
  await waitFor("document.body.innerText.includes('Authentication is temporarily unavailable')");
  console.log("PASS generic login denial and honest provider outage state");

  await command("Page.navigate", { url: new URL("sign-in", base).href });
  await waitFor("[...document.querySelectorAll('button')].some(button => button.textContent.includes('Phone number'))");
  await evaluate("[...document.querySelectorAll('button')].find(button => button.textContent.includes('Phone number'))?.click()");
  await waitInteractive("signin-phone");
  await enter("signin-phone", testPhone); await submit();
  await waitInteractive("signin-phone-code");
  assert.equal(await evaluate("document.activeElement?.id === 'signin-phone-code'"), true, "phone login focuses the OTP field after requesting a challenge");
  await enter("signin-phone-code", "123456"); await submit();
  await waitFor("location.pathname === '/account' && document.body.innerText.includes('You are signed in')");
  assert.equal(phoneLoginChallengeRequested && phoneLoginVerified, true, "phone sign-in requests the phone_login purpose and verifies it through the same-origin BFF");
  assert.equal(await evaluate("document.getElementById('account-phone') === null && document.body.innerText.includes('Your phone number is verified')"), true, "phone login lands on the phone sign-in account state, not the contact-verification form");
  assert.equal(await evaluate("document.cookie.includes('synthetic-session') === false && location.search === ''"), true, "phone sign-in keeps the session cookie HttpOnly and puts no proof in the URL");
  console.log("PASS phone number -> purpose-bound OTP -> secure authenticated account session");

  // The post-sign-in deferral must use only the destination returned by the session API.
  await evaluate("[...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Do this later')?.click()");
  await waitFor("location.pathname === '/' ");
  await command("Page.navigate", { url: new URL("sign-in", base).href }); await waitInteractive("signin-email");
  await enter("signin-email", "admin@example.test"); await enter("signin-password", "pass1234"); await submit();
  await waitFor("location.pathname === '/account' && document.body.innerText.includes('You are signed in')");
  await evaluate("[...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Do this later')?.click()");
  await waitFor("location.pathname === '/operations'");
  await command("Page.navigate", { url: new URL("sign-in", base).href }); await waitInteractive("signin-email");
  await enter("signin-email", "seller@example.test"); await enter("signin-password", "pass1234"); await submit();
  await waitFor("location.pathname === '/account' && document.body.innerText.includes('You are signed in')");
  await evaluate("[...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Do this later')?.click()");
  await waitFor("location.pathname === '/brands/2a6b7c8d-1111-4111-8111-123456789abc/products'");
  await command("Page.navigate", { url: new URL("sign-in", base).href }); await waitInteractive("signin-email");
  await enter("signin-email", "multi-seller@example.test"); await enter("signin-password", "pass1234"); await submit();
  await waitFor("location.pathname === '/account' && document.body.innerText.includes('You are signed in')");
  await evaluate("[...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Do this later')?.click()");
  await waitFor("document.body.innerText.includes('Choose a brand workspace')");
  await evaluate("[...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Second approved brand')?.click()");
  await waitFor("location.pathname === '/brands/3b7c8d9e-2222-4222-8222-234567890abc/products'");
  console.log("PASS role-based deferred routing for customer, admin, single-brand seller, and multi-brand choice");
} finally {
  for (const waiter of pending.values()) waiter.reject(new Error("Closing browser")); pending.clear();
  if (ws && ws.readyState === WebSocket.OPEN) ws.close();
  chrome.kill("SIGTERM"); await sleep(100); await rm(dir, { recursive: true, force: true }).catch(() => {});
  mockApi.closeAllConnections(); mockApi.close();
}
